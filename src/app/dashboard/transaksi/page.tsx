import { TransactionManager } from "@/components/dashboard/transaction-manager";
import { PageHeader } from "@/components/dashboard/ui";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  return <div className="space-y-6"><PageHeader eyebrow="Arus uang" title="Transaksi" description="Catat, cari, filter, kategorikan, dan ekspor seluruh aktivitas keuangan Anda." /><TransactionManager openOnLoad={params.new === "1"} /></div>;
}
