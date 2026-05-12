import {BUDGET_ACCOUNTS, MAX_RECEIPT_LINES} from '~/lib/reimbursement/validation';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.suggest-budget';

interface ReceiptInput {
  amount: number;
  description: string;
  placeOfPurchase?: string;
}

interface SuggestionResult {
  account: string;
  confidence: 'high' | 'medium' | 'low';
}

const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
type AiConfidence = (typeof CONFIDENCE_LEVELS)[number];

function isAiConfidence(value: unknown): value is AiConfidence {
  return typeof value === 'string' && (CONFIDENCE_LEVELS as readonly string[]).includes(value);
}

const validAccounts = new Set<string>(BUDGET_ACCOUNTS);

export async function action({request, context}: Route.ActionArgs) {
  try {
    const denied = await requireTurnstile(request, context.cloudflare.env.TURNSTILE_SECRET_KEY);
    if (denied) {
      return denied;
    }

    const body = (await request.json()) as {receipts?: ReceiptInput[]};

    if (!body.receipts || !Array.isArray(body.receipts) || body.receipts.length === 0) {
      return Response.json({error: 'receipts array is required'}, {status: 400});
    }

    const receipts = body.receipts.slice(0, MAX_RECEIPT_LINES);

    const receiptDescriptions = receipts
      .map(
        (receipt, receiptIndex) =>
          `Receipt ${receiptIndex + 1}: "${receipt.description}"${receipt.placeOfPurchase ? ` purchased at "${receipt.placeOfPurchase}"` : ''} for $${receipt.amount.toFixed(2)}`,
      )
      .join('\n');

    const accountList = BUDGET_ACCOUNTS.join('\n');

    const systemPrompt = `You are a helpful assistant for a school PTA reimbursement system. Given receipt descriptions, suggest the most appropriate budget account from the list below.

BUDGET ACCOUNTS:
${accountList}

RULES:
- Return ONLY valid JSON: an array of objects, one per receipt, in order.
- Each object must have "account" (exact name from the list) and "confidence" ("high", "medium", or "low").
- If unsure, use "low" confidence.
- Match based on the description and place of purchase.
- Return the JSON array and nothing else.`;

    const userPrompt = `Suggest budget accounts for these receipts:\n${receiptDescriptions}`;

    const result = await context.cloudflare.env.AI.run('@cf/moonshotai/kimi-k2.6', {
      messages: [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: userPrompt},
      ],
      max_tokens: 512,
    });

    const responseText = (result as {response?: string}).response ?? '';

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({suggestions: receipts.map(() => null)});
    }

    let parsed: unknown[];
    try {
      parsed = JSON.parse(jsonMatch[0]) as unknown[];
    } catch {
      return Response.json({suggestions: receipts.map(() => null)});
    }

    const suggestions = receipts.map((_, receiptIndex) => {
      const item = parsed[receiptIndex] as SuggestionResult | undefined;
      if (!item || typeof item.account !== 'string' || !validAccounts.has(item.account)) {
        return null;
      }
      const confidence = isAiConfidence(item.confidence) ? item.confidence : 'low';
      return {account: item.account, confidence};
    });

    return Response.json({suggestions});
  } catch (error) {
    console.error('Budget suggestion error:', error);
    return Response.json({suggestions: []});
  }
}
