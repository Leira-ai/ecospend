"use client";

const items = [
  { label: "Ringkasan", href: "#fitur" },
  { label: "Manfaat", href: "#manfaat" },
  { label: "Karbon", href: "#transparansi" },
  { label: "Aman", href: "#keamanan" },
  { label: "Performa", href: "#cta" },
];

export function ProofMarquee() {
  return (
    <div className="overflow-hidden border-y border-emerald-950/10 bg-white/80 py-3 backdrop-blur">
      <div className="animate-marquee flex w-max items-center gap-6 whitespace-nowrap text-xs font-semibold text-emerald-950/70">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-emerald-950/10 bg-white px-3 py-1 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
