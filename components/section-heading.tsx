interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  id?: string;
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({ eyebrow, title, id, className = "", titleClassName = "text-[#1A1F4D]" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="font-[Manrope] text-xs font-semibold text-[#005136]">{eyebrow}</p>
      <h2 id={id} className={`mt-2 text-balance font-[Archivo] text-2xl font-extrabold leading-tight tracking-[-0.015em] sm:text-[32px] ${titleClassName}`}>
        {title}
      </h2>
    </div>
  );
}
