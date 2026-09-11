export function FlowMark({ className = "h-20 w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 720 120" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path d="M-20 82C72 18 141 110 230 54C319-2 389 102 478 45C567-12 632 68 748 20" stroke="#2FA36B" strokeWidth="2" strokeLinecap="round" />
      <path d="M-10 100C80 48 151 126 241 72C331 18 407 114 496 62C585 10 658 88 742 46" stroke="#D99A2B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 8" />
      <circle cx="230" cy="54" r="6" fill="#F6F4EC" stroke="#2FA36B" strokeWidth="2" />
      <circle cx="478" cy="45" r="6" fill="#F6F4EC" stroke="#2FA36B" strokeWidth="2" />
    </svg>
  );
}
