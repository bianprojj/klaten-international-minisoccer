export function AnimatedCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-surface relative transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(26,31,77,0.14)] ${className}`}>
      {children}
    </div>
  );
}
