import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.subscribe';

const AUDIENCE_ID = '50ef78120e';

async function verifyTurnstile(token: string, secretKey: string, ip: string | null) {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: formData.toString(),
  });
  const outcome = (await res.json()) as {success: boolean};
  return outcome.success;
}

export async function action({request, context}: Route.ActionArgs) {
  try {
    const env = getCloudflare(context).env;
    const body = (await request.json()) as {email: string; turnstileToken?: string};

    // Verify Turnstile token
    const turnstileSecret = env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret || !body.turnstileToken) {
      return Response.json({error: 'Verification failed.'}, {status: 403});
    }

    const clientIp = request.headers.get('CF-Connecting-IP');
    const verified = await verifyTurnstile(body.turnstileToken, turnstileSecret, clientIp);
    if (!verified) {
      return Response.json({error: 'Verification failed. Please try again.'}, {status: 403});
    }

    const {email} = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({error: 'Valid email is required.'}, {status: 400});
    }

    const apiKey = env.MAILCHIMP_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      console.error('MAILCHIMP_API_KEY not configured');
      return Response.json({error: 'Newsletter signup is temporarily unavailable.'}, {status: 503});
    }

    const dc = apiKey.split('-').pop();

    const response = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
        }),
      },
    );

    if (response.ok) {
      return Response.json({success: true});
    }

    const data = (await response.json()) as {title?: string; detail?: string};

    if (data.title === 'Member Exists') {
      return Response.json({success: true, alreadySubscribed: true});
    }

    console.error('Mailchimp error:', data);
    return Response.json(
      {error: data.detail || 'Failed to subscribe. Please try again.'},
      {status: 400},
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}
