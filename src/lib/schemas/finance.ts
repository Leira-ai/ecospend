import { z } from "zod";
import {
  currencySchema, dateSchema, decimalSchema, hasDefinedMutation, optionalNullable,
  positiveMinorSchema, signedMinorSchema, timestampSchema, uuidSchema,
} from "./common";

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => optionalNullable(z.string().trim().max(max));
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const categoryKindSchema = z.enum(["expense", "income", "both"]);
const transactionKindSchema = z.enum(["expense", "income", "adjustment"]);
const statusSchema = z.enum(["pending", "cleared", "void"]);

export const profileUpdateSchema = z.strictObject({
  displayName: optionalNullable(trimmed(100)),
  currencyCode: currencySchema.optional(),
  locale: z.string().trim().min(2).max(20).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
}).refine(hasDefinedMutation, "At least one field is required");

export const accountCreateSchema = z.strictObject({
  name: trimmed(100),
  type: z.enum(["cash", "bank", "e_wallet", "credit_card", "investment", "other"]),
  currencyCode: currencySchema.default("IDR"),
  openingBalanceMinor: signedMinorSchema.default("0"),
  institutionName: optionalText(120),
  lastFour: optionalNullable(z.string().regex(/^[A-Za-z0-9]{1,4}$/)),
});
export const accountUpdateSchema = accountCreateSchema.partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");
export const accountArchiveSchema = z.strictObject({ id: uuidSchema, archived: z.boolean() });

export const categoryCreateSchema = z.strictObject({
  name: trimmed(80), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), kind: categoryKindSchema,
  parentId: optionalNullable(uuidSchema), icon: optionalText(50), color: optionalNullable(colorSchema),
  sortOrder: z.number().int().min(-100_000).max(100_000).default(0),
});
export const categoryUpdateSchema = categoryCreateSchema.partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");

export const merchantRuleCreateSchema = z.strictObject({
  accountId: optionalNullable(uuidSchema), categoryId: uuidSchema, pattern: trimmed(200),
  matchType: z.enum(["contains", "exact", "regex"]).default("contains"),
  caseSensitive: z.boolean().default(false), priority: z.number().int().min(0).max(10_000).default(100),
  isEnabled: z.boolean().default(true),
});
export const merchantRuleUpdateSchema = merchantRuleCreateSchema.partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");

const transactionShape = {
  accountId: uuidSchema, categoryId: optionalNullable(uuidSchema), kind: transactionKindSchema,
  status: statusSchema.default("cleared"), amountMinor: positiveMinorSchema,
  currencyCode: currencySchema.default("IDR"), merchantName: optionalText(160),
  description: z.string().max(500).default(""), notes: optionalText(4000), externalId: optionalText(255),
  transactedAt: timestampSchema, postedAt: optionalNullable(timestampSchema),
};
export const transactionCreateSchema = z.strictObject(transactionShape).superRefine((value, context) => {
  if ((value.kind === "expense" || value.kind === "income") && !value.categoryId) {
    context.addIssue({ code: "custom", path: ["categoryId"], message: "Category is required" });
  }
});
export const transactionUpdateSchema = z.strictObject(transactionShape).partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");
export const transferCreateSchema = z.strictObject({
  sourceAccountId: uuidSchema, destinationAccountId: uuidSchema, amountMinor: positiveMinorSchema,
  transactedAt: timestampSchema.optional(), description: z.string().max(500).default(""), notes: optionalText(4000),
}).refine((value) => value.sourceAccountId !== value.destinationAccountId, {
  path: ["destinationAccountId"], message: "Destination account must differ",
});

export const transactionBulkSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("delete"), ids: z.array(uuidSchema).min(1).max(100) }),
  z.strictObject({ operation: z.literal("status"), ids: z.array(uuidSchema).min(1).max(100), status: statusSchema }),
  z.strictObject({ operation: z.literal("category"), ids: z.array(uuidSchema).min(1).max(100), categoryId: uuidSchema.nullable() }),
]);

const budgetShape = {
  categoryId: uuidSchema, name: trimmed(100), amountMinor: positiveMinorSchema,
  currencyCode: currencySchema.default("IDR"), period: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
  startsOn: dateSchema, endsOn: optionalNullable(dateSchema), rolloverEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true), alertThresholdPercent: z.number().int().min(1).max(100).default(80),
};
export const budgetCreateSchema = z.strictObject(budgetShape)
  .refine((value) => !value.endsOn || value.endsOn >= value.startsOn, { path: ["endsOn"], message: "End date precedes start date" });
export const budgetUpdateSchema = z.strictObject(budgetShape).partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");

export const goalCreateSchema = z.strictObject({
  accountId: optionalNullable(uuidSchema), name: trimmed(120), targetAmountMinor: positiveMinorSchema,
  currencyCode: currencySchema.default("IDR"), targetDate: optionalNullable(dateSchema),
  status: z.enum(["active", "paused", "completed", "cancelled"]).default("active"), notes: optionalText(2000),
});
export const goalUpdateSchema = goalCreateSchema.partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");
export const contributionCreateSchema = z.strictObject({
  goalId: uuidSchema, transactionId: optionalNullable(uuidSchema), amountMinor: positiveMinorSchema,
  contributedAt: timestampSchema.optional(), note: optionalText(500),
});

const recurringShape = {
  accountId: uuidSchema, categoryId: optionalNullable(uuidSchema), kind: z.enum(["expense", "income"]),
  amountMinor: positiveMinorSchema, currencyCode: currencySchema.default("IDR"), merchantName: optionalText(160),
  description: z.string().max(500).default(""), frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  intervalCount: z.number().int().min(1).max(365).default(1), nextDueOn: dateSchema,
  endsOn: optionalNullable(dateSchema), isActive: z.boolean().default(true),
};
export const recurringCreateSchema = z.strictObject(recurringShape)
  .refine((value) => !value.endsOn || value.endsOn >= value.nextDueOn, { path: ["endsOn"], message: "End date precedes due date" })
  .superRefine((value, context) => {
    if (!value.categoryId) context.addIssue({ code: "custom", path: ["categoryId"], message: "Category is required" });
  });
export const recurringUpdateSchema = z.strictObject(recurringShape).partial().extend({ id: uuidSchema })
  .refine(hasDefinedMutation, "At least one field is required");

export const notificationUpdateSchema = z.strictObject({
  id: uuidSchema, status: z.enum(["unread", "read", "archived"]),
});
export const notificationBulkSchema = z.strictObject({
  ids: z.array(uuidSchema).min(1).max(100), status: z.enum(["unread", "read", "archived"]),
});

export const carbonEstimateSchema = z.strictObject({
  transactionId: uuidSchema, emissionFactorId: uuidSchema, activityAmount: decimalSchema,
});
export const carbonRecalculateSchema = z.strictObject({ id: uuidSchema, activityAmount: decimalSchema });

export const accountDeleteSchema = z.strictObject({ confirmation: z.literal("DELETE") });
