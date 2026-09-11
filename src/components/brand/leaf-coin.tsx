type LeafCoinProps = {
  className?: string;
  title?: string;
};

export function LeafCoin({ className = "size-10", title }: LeafCoinProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id="leafCoinFill" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8EF87" />
          <stop offset="0.48" stopColor="#57C87A" />
          <stop offset="1" stopColor="#16714C" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#leafCoinFill)" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="#0E3B2C" strokeOpacity="0.24" strokeWidth="1.5" />
      <path d="M20 39c2-13 10-21 25-23-1 14-7 24-20 27-4 1-7-1-5-4Z" fill="#F8F6ED" />
      <path d="M21 43c7-9 13-14 22-21" fill="none" stroke="#0E3B2C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 33v-6m0 12v-3" fill="none" stroke="#0E3B2C" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
