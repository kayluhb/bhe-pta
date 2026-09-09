import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {buildMemberRows} from '~/lib/membership/build-rows';
import {toImportCsv} from '~/lib/membership/csv-output';
import {clusterDuplicateSubmissions} from '~/lib/membership/dedupe';
import {MembershipImportError} from '~/lib/membership/errors';
import {parseCheddarUpExport} from '~/lib/membership/parse';
import type {MemberRow} from '~/lib/membership/types';
import type {Route} from './+types/api.admin.membership-import';

interface SchoolYearRow {
  id: string;
  starts_on: string;
}

export async function action({request, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const db = env.REIMBURSEMENT_DB;
  const formData = await request.formData();
  const schoolYearId = formData.get('schoolYearId');
  const file = formData.get('file');

  if (typeof schoolYearId !== 'string' || !schoolYearId) {
    return Response.json({error: 'schoolYearId is required'}, {status: 400});
  }
  if (!(file instanceof File)) {
    return Response.json({error: 'file is required'}, {status: 400});
  }

  const schoolYear = await db
    .prepare('SELECT id, starts_on FROM school_years WHERE id = ?')
    .bind(schoolYearId)
    .first<SchoolYearRow>();
  if (!schoolYear) {
    return Response.json({error: 'Unknown school year'}, {status: 400});
  }

  let built: {rows: MemberRow[]; skippedChildLines: {familyName: string; line: string}[]};
  try {
    const csvText = await file.text();
    const submissions = parseCheddarUpExport(csvText);
    const clustered = clusterDuplicateSubmissions(submissions);
    built = buildMemberRows(clustered, schoolYear.starts_on);
  } catch (error) {
    if (error instanceof MembershipImportError) {
      return Response.json({error: error.message}, {status: 400});
    }
    throw error;
  }

  const existing = await db
    .prepare('SELECT email FROM pta_members WHERE school_year_id = ?')
    .bind(schoolYearId)
    .all<{email: string}>();
  const alreadyTracked = new Set(existing.results.map((row) => row.email.toLowerCase()));

  const newRows: MemberRow[] = [];
  const seenThisUpload = new Set<string>();
  let alreadyTrackedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedBlankEmailCount = 0;

  for (const row of built.rows) {
    const emailKey = row.email.toLowerCase();
    if (!emailKey) {
      skippedBlankEmailCount += 1;
      continue;
    }
    if (alreadyTracked.has(emailKey)) {
      alreadyTrackedCount += 1;
      continue;
    }
    if (seenThisUpload.has(emailKey)) {
      skippedDuplicateCount += 1;
      continue;
    }
    seenThisUpload.add(emailKey);
    newRows.push(row);
  }

  if (newRows.length > 0) {
    const insertStatement = db.prepare(
      `INSERT INTO pta_members
        (id, school_year_id, role, email, first_name, middle_name, last_name, gender,
         address, city, state, zip, home_phone, cell_phone, lifetime, paid_date,
         source_document_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    await db.batch(
      newRows.map((row) =>
        insertStatement.bind(
          crypto.randomUUID(),
          schoolYearId,
          row.role,
          row.email.toLowerCase(),
          row.firstName,
          row.middleName,
          row.lastName,
          row.address,
          row.city,
          row.state,
          row.zip,
          row.homePhone,
          row.cellPhone,
          row.lifetime ? 1 : 0,
          row.paidDate,
          row.sourceDocumentNumber,
        ),
      ),
    );
  }

  const csv = toImportCsv(newRows);

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="pta-import-${schoolYearId}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv',
      'X-Already-Tracked-Count': String(alreadyTrackedCount),
      'X-New-Count': String(newRows.length),
      'X-Skipped-Blank-Email-Count': String(skippedBlankEmailCount),
      'X-Skipped-Child-Details': encodeURIComponent(JSON.stringify(built.skippedChildLines)),
      'X-Skipped-Child-Lines': String(built.skippedChildLines.length),
      'X-Skipped-Duplicate-Count': String(skippedDuplicateCount),
    },
  });
}
