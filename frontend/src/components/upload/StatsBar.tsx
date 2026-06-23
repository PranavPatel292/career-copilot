interface StatsBarProps {
  documentCount: number;
  chunkCount: number;
}

export function StatsBar({ documentCount, chunkCount }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <StatCard label="Documents" value={documentCount} />
      <StatCard label="Chunks" value={chunkCount} />
      <StatCard label="KB version" value="—" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <p className="text-xs text-tertiary">{label}</p>
      <p className="text-xl font-medium text-foreground">{value}</p>
    </div>
  );
}
