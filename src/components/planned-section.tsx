import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Honest placeholder for sections that are not built yet. */
export function PlannedSection({ phase, items }: { phase: string; items: string[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <Construction aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-subtle" />
        <div>
          <p className="font-medium text-fg">Not built yet — planned for {phase}</p>
          <p className="mt-1 text-sm text-muted">
            This page is intentionally empty. Nothing here reads from or changes the live game.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
