import { buildImportPreview } from "@/lib/supabase/data/import";
import { canonicalDigest, createPreviewToken } from "@/lib/supabase/data/import-token";
import { ApiError, json, withAuth } from "@/lib/supabase/data/http";
import { enforceRateLimit } from "@/lib/supabase/data/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    enforceRateLimit(`import-preview:${user.id}`, 10, 15 * 60 * 1_000);
    const type = request.headers.get("content-type") ?? "";
    if (!type.toLowerCase().startsWith("multipart/form-data")) throw new ApiError(415, "unsupported_media_type", "Expected multipart/form-data");
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 6 * 1024 * 1024) throw new ApiError(413, "payload_too_large", "Multipart body is too large");
    const form = await request.formData(); const item = form.get("file");
    if (!(item instanceof File)) throw new ApiError(422, "file_required", "A file field is required");
    const preview = await buildImportPreview(client, user.id, item);
    const invalidRows = new Set(preview.errors.map((error) => error.row));
    const duplicateRows = new Set(preview.duplicates);
    const committableRows = preview.rows.filter((_row, index) => !invalidRows.has(preview.sourceRows[index]) && !duplicateRows.has(index));
    const digest = canonicalDigest(committableRows);
    return json({
      data: {
        rows: preview.rows, sourceRows: preview.sourceRows, errors: preview.errors, duplicateRows: preview.duplicates,
        committableRows, digest, token: createPreviewToken(user.id, digest),
        fileSha256: preview.fileSha256, totalRows: preview.totalRows,
      },
      limits: { fileBytes: 5 * 1024 * 1024, rows: 1_000, tokenTtlSeconds: 900 },
      rateLimit: "Best-effort per server instance; production should use a shared edge/store limit.",
    });
  }, { mutation: true });
}
