import { Button } from "@/components/ui/Button";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-danger/30 bg-danger-surface px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Спробувати ще раз
        </Button>
      )}
    </div>
  );
}
