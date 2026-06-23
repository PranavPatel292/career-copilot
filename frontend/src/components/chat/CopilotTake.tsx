import { IconBulb } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface CopilotTakeProps {
  text: string;
  isPending: boolean;
}

export function CopilotTake({ text, isPending }: CopilotTakeProps) {
  return (
    <div
      className={cn(
        "mt-3.5 rounded-[10px] bg-suggested-bg px-3.5 py-3 transition-opacity",
        isPending && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1.5">
        <IconBulb className="size-3.5 text-suggested-label" aria-hidden="true" />
        <span className="text-xs font-medium text-suggested-label">
          Copilot&apos;s take
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-[1.65] text-suggested-body">
        {text}
      </p>
    </div>
  );
}
