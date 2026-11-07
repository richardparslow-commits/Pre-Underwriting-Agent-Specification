import { RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/surface";

interface SessionCheckCardProps {
  message: string;
  onRetry: () => void;
}

export function SessionCheckCard({ message, onRetry }: SessionCheckCardProps) {
  return (
    <div className="container max-w-md py-16">
      <div className="panel p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
          <ShieldAlert className="h-4 w-4" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl leading-snug">
          We could not check your session
        </h1>
        <div role="alert">
          <Alert tone="danger" className="mt-4">
            {message}
          </Alert>
        </div>
        <Button className="mt-5" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}
