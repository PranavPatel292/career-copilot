interface LoadingDotsProps {
  label?: string;
}

export function LoadingDots({ label = "Searching knowledge base..." }: LoadingDotsProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-tertiary"
            style={{
              animation: "dot-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
