type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto items-center text-center" : "items-start";

  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      <p className="mb-4 inline-flex rounded-full border border-[var(--paper-line)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1e6f4e] dark:border-emerald-400/20 dark:bg-[#0b1a13] dark:text-[#8bd3a7]">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] text-[#0e3b2c] sm:text-4xl lg:text-5xl dark:text-[#eef5ef]">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-7 text-[#43544b] sm:text-lg dark:text-[#b8c7bd]">
        {description}
      </p>
    </div>
  );
}
