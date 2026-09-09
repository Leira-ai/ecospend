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
      <p className="mb-4 inline-flex rounded-full border border-emerald-700/15 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] text-emerald-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
