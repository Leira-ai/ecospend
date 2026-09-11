import Link from "next/link";
import { LeafCoin } from "@/components/brand/leaf-coin";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-lg text-[var(--forest)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--moss)] focus-visible:ring-offset-4 dark:text-[#eef5ef]"
      aria-label="EcoSpend, kembali ke beranda"
    >
      <LeafCoin className="size-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none" />
      {!compact && (
        <span className="font-display text-lg font-extrabold">EcoSpend</span>
      )}
    </Link>
  );
}
