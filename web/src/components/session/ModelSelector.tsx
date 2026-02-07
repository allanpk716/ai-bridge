import { Zap, Scale, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ModelType = "haiku" | "sonnet" | "opus" | null;

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: "haiku" | "sonnet" | "opus") => void;
}

interface ModelOption {
  id: "haiku" | "sonnet" | "opus";
  name: string;
  description: string;
  useCase: string;
  icon: React.ReactNode;
}

/**
 * ModelSelector component
 *
 * Card-based model selection with 3 options:
 * - Haiku: Fast and efficient
 * - Sonnet: Balanced (default)
 * - Opus: Most capable
 *
 * Features:
 * - Grid layout (3 columns desktop, 1 mobile)
 * - Visual feedback for selection
 * - Hover effects
 */
export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const models: ModelOption[] = [
    {
      id: "haiku",
      name: "Haiku",
      description: "Fast and efficient for quick tasks",
      useCase: "Best for simple queries and rapid iteration",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: "sonnet",
      name: "Sonnet",
      description: "Balanced performance for most tasks",
      useCase: "Recommended for general-purpose coding",
      icon: <Scale className="h-5 w-5" />,
    },
    {
      id: "opus",
      name: "Opus",
      description: "Most capable for complex tasks",
      useCase: "Best for complex problem-solving",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {models.map((model) => {
        const isSelected = value === model.id;

        return (
          <Card
            key={model.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "border-primary border-2 shadow-sm"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onChange(model.id)}
          >
            <div className="p-6 space-y-4">
              {/* Icon and Name */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {model.icon}
                </div>
                <h3 className="font-semibold text-lg">{model.name}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {model.description}
              </p>

              {/* Use Case */}
              <p className="text-xs text-muted-foreground">{model.useCase}</p>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Selected
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
