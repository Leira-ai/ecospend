"use client";

const items = [
  { label: "Ringkasan" },
  { label: "Anggaran" },
  { label: "Karbon" },
  { label: "RLS aktif" },
  { label: "Mode demo" },
];

export function ProofMarquee() {
  return (
    <div className="overflow-hidden border-y border-[var(--paper-line)] bg-[var(--paper)]/80 py-3 backdrop-blur" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center gap-6 whitespace-nowrap text-xs font-semibold text-[#43544b] motion-reduce:animate-none dark:text-[#b8c7bd]">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--paper-line)] bg-white px-3 py-1 shadow-sm dark:border-white/10 dark:bg-[var(--paper)]">
            <span className="size-2 rounded-full bg-[#1e6f4e] dark:bg-[#8bd3a7]" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
