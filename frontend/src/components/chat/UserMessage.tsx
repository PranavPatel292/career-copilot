interface UserMessageProps {
  question: string;
}

export function UserMessage({ question }: UserMessageProps) {
  return (
    <div className="max-w-[80%] flex justify-end">
      <div className="max-w-[80%] rounded-xl border border-border bg-card px-3.5 py-2.5">
        <p className="text-sm text-foreground">{question}</p>
      </div>
    </div>
  );
}
