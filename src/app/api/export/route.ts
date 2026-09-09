import type { SupabaseClient } from "@supabase/supabase-js";
import { throwIfError, withAuth } from "@/lib/supabase/data/http";
import { enforceRateLimit } from "@/lib/supabase/data/rate-limit";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";

const EXPORT_PAGE_SIZE = 1_000;
const formulaPrefix = /^[\s\t]*[=+\-@]/;
const REDACTED_KEYS = new Set([
  "user_id", "storage_path", "file_sha256", "sha256", "options",
  "password", "secret", "token", "access_token", "refresh_token", "service_role_key",
]);

const tables = {
  profiles: "id,display_name,currency_code,locale,timezone,created_at,updated_at",
  accounts: "id,name,type,currency_code,opening_balance_minor::text,institution_name,last_four,is_archived,created_at,updated_at",
  categories: "id,name,slug,kind,parent_id,icon,color,is_system,sort_order,created_at,updated_at",
  transactions: "id,account_id,category_id,import_job_id,transfer_group_id,kind,status,source,amount_minor::text,currency_code,merchant_name,description,notes,external_id,transacted_at,posted_at,created_at,updated_at",
  tags: "id,name,color,created_at,updated_at",
  transaction_tags: "transaction_id,tag_id,created_at",
  merchant_rules: "id,account_id,category_id,pattern,match_type,case_sensitive,priority,is_enabled,created_at,updated_at",
  budgets: "id,category_id,name,amount_minor::text,currency_code,period,starts_on,ends_on,rollover_enabled,is_active,alert_threshold_percent,created_at,updated_at",
  financial_goals: "id,account_id,name,target_amount_minor::text,currency_code,target_date,status,notes,created_at,updated_at",
  goal_contributions: "id,goal_id,transaction_id,amount_minor::text,contributed_at,note,created_at",
  recurring_transactions: "id,account_id,category_id,kind,amount_minor::text,currency_code,merchant_name,description,frequency,interval_count,next_due_on,ends_on,last_generated_at,is_active,created_at,updated_at",
  import_jobs: "id,status,source_name,original_filename,total_rows,imported_rows,skipped_rows,error_rows,error_summary,started_at,completed_at,created_at,updated_at",
  notifications: "id,type,status,title,body,data,read_at,created_at,updated_at",
  transaction_attachments: "id,transaction_id,original_filename,content_type,size_bytes::text,created_at",
  transaction_carbon_estimates: "id,transaction_id,emission_factor_id,activity_amount::text,estimated_kg_co2e::text,factor_key_snapshot,factor_version_snapshot,factor_name_snapshot,activity_unit_snapshot,kg_co2e_per_unit_snapshot::text,source_snapshot,methodology_snapshot,calculated_at,created_at",
} as const;

type TableName = keyof typeof tables;
type ExportRecord = Record<string, unknown>;

export function makeFormulaSafe(value: unknown, key?: string): unknown {
  if (key && REDACTED_KEYS.has(key.toLowerCase())) return undefined;
  if (typeof value === "string") return formulaPrefix.test(value) ? `'${value}` : value;
  if (Array.isArray(value)) return value.map((item) => makeFormulaSafe(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).flatMap(([entryKey, item]) => {
      const safe = makeFormulaSafe(item, entryKey);
      return safe === undefined ? [] : [[entryKey, safe]];
    }));
  }
  return value;
}

export async function fetchOwnedRows(client: SupabaseClient, table: TableName, userId: string): Promise<ExportRecord[]> {
  const rows: ExportRecord[] = [];
  const ownerColumn = table === "profiles" ? "id" : "user_id";
  for (let from = 0; ; from += EXPORT_PAGE_SIZE) {
    const columns: string = tables[table];
    const { data, error } = await client.from(table).select(columns)
      .eq(ownerColumn, userId).order("created_at", { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1);
    throwIfError(error);
    const page = (data ?? []) as unknown as ExportRecord[];
    rows.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) break;
  }
  return rows;
}

function carbonEstimate(row: ExportRecord): ExportRecord {
  const {
    emission_factor_id, factor_key_snapshot, factor_version_snapshot, factor_name_snapshot,
    activity_unit_snapshot, kg_co2e_per_unit_snapshot, source_snapshot, methodology_snapshot,
    ...estimate
  } = row;
  return {
    ...estimate,
    factor_snapshot: {
      emission_factor_id,
      factor_key: factor_key_snapshot,
      version: factor_version_snapshot,
      name: factor_name_snapshot,
      activity_unit: activity_unit_snapshot,
      kg_co2e_per_unit: kg_co2e_per_unit_snapshot,
      provenance: source_snapshot,
      methodology: methodology_snapshot,
    },
  };
}

export async function createAccountExport(client: SupabaseClient, userId: string, exportedAt = new Date().toISOString()) {
  const entries = await Promise.all((Object.keys(tables) as TableName[]).map(async (table) => (
    [table, await fetchOwnedRows(client, table, userId)] as const
  )));
  const data = Object.fromEntries(entries) as Record<TableName, ExportRecord[]>;
  const document = {
    format: "ecospend-account-export",
    version: 1,
    exportedAt,
    profile: data.profiles[0] ?? null,
    finance: {
      accounts: data.accounts,
      categories: data.categories,
      transactions: data.transactions,
      tags: data.tags,
      transactionTags: data.transaction_tags,
      merchantRules: data.merchant_rules,
      budgets: data.budgets,
      goals: data.financial_goals,
      goalContributions: data.goal_contributions,
      recurringTransactions: data.recurring_transactions,
      importHistory: data.import_jobs,
      attachments: data.transaction_attachments,
    },
    carbon: { estimates: data.transaction_carbon_estimates.map(carbonEstimate) },
    notifications: data.notifications,
  };
  return makeFormulaSafe(serializeDatabaseValue(document));
}

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    enforceRateLimit(`account-export:${user.id}`, 5, 60 * 60 * 1_000);
    const exportedAt = new Date().toISOString();
    const body = JSON.stringify(await createAccountExport(client, user.id, exportedAt), null, 2);
    return new Response(body, { headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecospend-export-${exportedAt.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      "X-Content-Type-Options": "nosniff",
    } });
  }, { mutation: true });
}
