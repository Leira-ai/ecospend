import { z } from "zod";
import { currencySchema, positiveMinorSchema, timestampSchema, uuidSchema } from "./common";

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 1_000;
export const IMPORT_PREVIEW_TTL_MS = 15 * 60 * 1_000;

export const importRowSchema = z.strictObject({
  accountId: uuidSchema,
  categoryId: uuidSchema.nullable().optional(),
  kind: z.enum(["expense", "income"]),
  amountMinor: positiveMinorSchema,
  currencyCode: currencySchema.default("IDR"),
  merchantName: z.string().trim().max(160).nullable().optional(),
  description: z.string().max(500).default(""),
  notes: z.string().trim().max(4000).nullable().optional(),
  transactedAt: timestampSchema,
  postedAt: timestampSchema.nullable().optional(),
});

export const importCommitSchema = z.strictObject({
  token: z.string().min(32).max(512),
  digest: z.string().regex(/^[0-9a-f]{64}$/),
  rows: z.array(importRowSchema).min(1).max(IMPORT_MAX_ROWS),
  sourceName: z.string().trim().min(1).max(100).default("spreadsheet"),
  originalFilename: z.string().trim().min(1).max(255).optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;
