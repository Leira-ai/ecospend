import { createHash } from "node:crypto";
import { importCommitSchema } from "@/lib/schemas/import";
import { canonicalDigest, verifyPreviewToken } from "@/lib/supabase/data/import-token";
import { ApiError, json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { enforceRateLimit } from "@/lib/supabase/data/rate-limit";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

function externalId(row: { transactedAt: string; kind: string; amountMinor: string; accountId: string; categoryId?: string | null; merchantName?: string | null }): string {
  return createHash("sha256").update([row.transactedAt, row.kind, row.amountMinor, row.accountId, row.categoryId ?? "", row.merchantName?.toLocaleLowerCase("id-ID") ?? ""].join("|")).digest("hex");
}

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    enforceRateLimit(`import-commit:${user.id}`, 5, 15 * 60 * 1_000);
    const input = await parseJson(request, importCommitSchema); const digest = canonicalDigest(input.rows);
    if (input.digest !== digest) throw new ApiError(422, "digest_mismatch", "Import payload differs from its preview");
    verifyPreviewToken(input.token, user.id, digest);
    const accountIds = [...new Set(input.rows.map((row) => row.accountId))];
    const categoryIds = [...new Set(input.rows.flatMap((row) => row.categoryId ? [row.categoryId] : []))];
    if (categoryIds.length !== new Set(input.rows.map((row) => row.categoryId)).size) {
      throw new ApiError(422, "category_required", "Every imported transaction requires a category");
    }
    const [accountResult, categoryResult] = await Promise.all([
      client.from("accounts").select("id,currency_code").eq("user_id", user.id).eq("is_archived", false).in("id", accountIds),
      client.from("categories").select("id,kind").in("id", categoryIds).or(`is_system.eq.true,user_id.eq.${user.id}`),
    ]);
    throwIfError(accountResult.error); throwIfError(categoryResult.error);
    if ((accountResult.data?.length ?? 0) !== accountIds.length || (categoryResult.data?.length ?? 0) !== categoryIds.length) {
      throw new ApiError(422, "references_changed", "An account or category is no longer available");
    }
    const accountCurrencies = new Map((accountResult.data ?? []).map((row) => [String(row.id), String(row.currency_code)]));
    const categoryKinds = new Map((categoryResult.data ?? []).map((row) => [String(row.id), String(row.kind)]));
    if (input.rows.some((row) => accountCurrencies.get(row.accountId) !== row.currencyCode
      || !row.categoryId || ![row.kind, "both"].includes(categoryKinds.get(row.categoryId) ?? ""))) {
      throw new ApiError(422, "references_changed", "An account currency or category kind changed after preview");
    }
    const { data: job, error: jobError } = await client.from("import_jobs").insert({
      user_id: user.id, status: "processing", source_name: input.sourceName,
      original_filename: input.originalFilename, options: { digest }, total_rows: input.rows.length,
      started_at: new Date().toISOString(),
    }).select("id").single();
    throwIfError(jobError);
    const payload = input.rows.map((row) => ({
      user_id: user.id, import_job_id: job.id, source: "import", external_id: externalId(row),
      account_id: row.accountId, category_id: row.categoryId, kind: row.kind, status: "cleared",
      amount_minor: row.amountMinor, currency_code: row.currencyCode, merchant_name: row.merchantName,
      description: row.description, notes: row.notes, transacted_at: row.transactedAt, posted_at: row.postedAt,
    }));
    const { data, error } = await client.from("transactions").upsert(payload, {
      onConflict: "user_id,import_job_id,external_id", ignoreDuplicates: true,
    }).select("id,account_id,category_id,kind,status,source,amount_minor::text,currency_code,merchant_name,description,notes,external_id,transacted_at,posted_at,created_at");
    if (error) {
      await client.from("import_jobs").update({ status: "failed", error_rows: input.rows.length, error_summary: { code: "insert_failed" }, completed_at: new Date().toISOString() }).eq("id", job.id).eq("user_id", user.id);
      throw error;
    }
    const importedRows = data?.length ?? 0;
    const { error: completionError } = await client.from("import_jobs").update({
      status: "completed", imported_rows: importedRows, skipped_rows: input.rows.length - importedRows, completed_at: new Date().toISOString(),
    }).eq("id", job.id).eq("user_id", user.id);
    throwIfError(completionError);
    return json({ data: { jobId: job.id, transactions: serializeDatabaseValue(data), importedRows, skippedRows: input.rows.length - importedRows } }, { status: 201 });
  }, { mutation: true });
}
