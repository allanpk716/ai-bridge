import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, RotateCcw, Plus, Check, Loader2 } from "lucide-react";
import { type Session } from "@/types/api";
import { cn } from "@/lib/utils";

type ResumeMode = "continue" | "resume" | "new";

interface ResumeSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  onConfirm: (mode: ResumeMode) => void;
  isResuming: boolean;
}

/**
 * ResumeSessionDialog component
 *
 * Dialog for choosing how to resume a stopped session with:
 * - Continue: Continue session where it left off (--continue)
 * - Resume: Restore session to previous state (--resume)
 * - Start New: Create new session with same working directory
 *
 * Per CONTEXT.md requirement: Shows three options with card-based selection
 */
export function ResumeSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isResuming,
}: ResumeSessionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<ResumeMode>("continue");

  const { id, metadata = {} } = session;
  const sessionName = (metadata.name as string | undefined) || id;

  const resumeOptions = [
    {
      mode: "continue" as const,
      title: "Continue",
      description: "Continue this session where it left off",
      icon: Play,
      recommended: true,
    },
    {
      mode: "resume" as const,
      title: "Resume",
      description: "Restore session to previous state",
      icon: RotateCcw,
      recommended: false,
    },
    {
      mode: "new" as const,
      title: "Start New Session",
      description: "Create a new session with the same working directory",
      icon: Plus,
      recommended: false,
    },
  ];

  const handleConfirm = () => {
    onConfirm(selectedMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resume Session</DialogTitle>
          <DialogDescription>
            Choose how you want to resume "{sessionName}"
          </DialogDescription>
        </DialogHeader>

        {/* Resume Options */}
        <div className="space-y-3 my-4">
          {resumeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMode === option.mode;

            return (
              <Card
                key={option.mode}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5",
                  option.recommended && "border-primary/50"
                )}
                onClick={() => setSelectedMode(option.mode)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{option.title}</h4>
                      {option.recommended && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isResuming}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isResuming}>
            {isResuming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
