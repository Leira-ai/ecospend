import Link from "next/link";
import { Leaf } from "lucide-react";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 rounded-lg text-emerald-950 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4"
      aria-label="EcoSpend, kembali ke beranda"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm">
        <Leaf className="size-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-[-0.03em]">EcoSpend</span>
      )}
    </Link>
  );
}
