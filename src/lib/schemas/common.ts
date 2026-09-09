import { z } from "zod";

const BIGINT_MAX = 9_223_372_036_854_775_807n;
const BIGINT_MIN = -9_223_372_036_854_775_808n;

function bigintString(min: bigint, max: bigint, message: string) {
  return z.string().regex(/^-?\d+$/, message).refine((value) => {
    try {
      const parsed = BigInt(value);
      return parsed >= min && parsed <= max;
    } catch {
      return false;
    }
  }, message);
}

export const uuidSchema = z.uuid();
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const dateSchema = z.iso.date();
export const timestampSchema = z.iso.datetime({ offset: true });
export const positiveMinorSchema = bigintString(1n, BIGINT_MAX, "Must be a positive BIGINT decimal string");
export const signedMinorSchema = bigintString(BIGINT_MIN, BIGINT_MAX, "Must be a BIGINT decimal string");
export const decimalSchema = z.string().regex(/^\d+(?:\.\d{1,9})?$/).refine(
  (value) => Number.isFinite(Number(value)),
  "Must be a non-negative decimal string",
);

export const idBodySchema = z.strictObject({ id: uuidSchema });
export const idsBodySchema = z.strictObject({ ids: z.array(uuidSchema).min(1).max(100) });
export const paginationSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export function optionalNullable<T extends z.ZodType>(schema: T) {
  return schema.nullable().optional();
}

export function hasDefinedMutation(value: Record<string, unknown>, ignored = ["id"]): boolean {
  return Object.entries(value).some(([key, item]) => !ignored.includes(key) && item !== undefined);
}
