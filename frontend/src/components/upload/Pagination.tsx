import { Button } from "@/components/ui/button";

interface PaginationProps {
  hasMore: boolean;
  onLoadMore: () => void;
}

export function Pagination({ hasMore, onLoadMore }: PaginationProps) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" size="sm" onClick={onLoadMore}>
        Load more
      </Button>
    </div>
  );
}
