import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkingDirectoryPicker } from "./WorkingDirectoryPicker";
import { ModelSelector } from "./ModelSelector";
import { CliParametersForm } from "./CliParametersForm";
import { ConfirmStep } from "./ConfirmStep";
import { useCreateSession } from "@/lib/api/sessions";
import { useNavigateToSession } from "@/router";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_DIRECTORIES_KEY = "ai-bridge.recent-directories";

/**
 * CreateSessionDialog component
 *
 * Multi-step wizard for creating new Claude Code sessions.
 *
 * Steps:
 * 1. Working Directory - Select project folder
 * 2. Model Selection - Choose Haiku/Sonnet/Opus
 * 3. CLI Parameters - Configure startup options
 * 4. Confirm - Review and create
 *
 * Features:
 * - Sequential navigation with validation
 * - Auto-generated session names
 * - Recent directories persistence
 * - Git information detection
 */
export function CreateSessionDialog({
  open,
  onOpenChange,
}: CreateSessionDialogProps) {
  const navigateToSession = useNavigateToSession();
  const createSession = useCreateSession();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form state
  const [workingDir, setWorkingDir] = useState("");
  const [workingDirError, setWorkingDirError] = useState<string | null>(null);
  const [model, setModel] = useState<"haiku" | "sonnet" | "opus">("sonnet");
  const [sessionName, setSessionName] = useState("");
  const [dangerouslySkipPermissions, setDangerouslySkipPermissions] =
    useState(false);
  const [permissionMode, setPermissionMode] = useState<"normal" | "strict">(
    "normal"
  );
  const [diff, setDiff] = useState(false);

  // Metadata
  const [gitInfo, setGitInfo] = useState<{ branch: string } | undefined>();
  const [recentDirectories, setRecentDirectories] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load recent directories on mount
  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem(RECENT_DIRECTORIES_KEY);
        if (stored) {
          const dirs = JSON.parse(stored) as string[];
          setRecentDirectories(dirs);
        }
      } catch (e) {
        console.error("Failed to load recent directories:", e);
      }
    }
  }, [open]);

  // Auto-generate session name from working directory
  useEffect(() => {
    if (workingDir && !sessionName) {
      const folderName =
        workingDir.split("\\").pop() ||
        workingDir.split("/").pop() ||
        workingDir;
      setSessionName(folderName);
    } else if (!workingDir && !sessionName) {
      // Generate timestamp-based name
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0];
      setSessionName(`Session ${timestamp}`);
    }
  }, [workingDir, sessionName]);

  // Detect git repo when working dir changes
  useEffect(() => {
    if (workingDir) {
      // For now, just set a placeholder
      // In a real implementation, you'd check if it's a git repo
      setGitInfo(undefined);
    } else {
      setGitInfo(undefined);
    }
  }, [workingDir]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setWorkingDir("");
      setWorkingDirError(null);
      setModel("sonnet");
      setSessionName("");
      setDangerouslySkipPermissions(false);
      setPermissionMode("normal");
      setDiff(false);
      setErrors({});
      setGitInfo(undefined);
    }
  }, [open]);

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!workingDir.trim()) {
        newErrors.workingDir = "Working directory is required";
        setWorkingDirError("Working directory is required");
        return false;
      }
      setWorkingDirError(null);
    }

    if (step === 2) {
      if (!model) {
        newErrors.model = "Please select a model";
        setErrors(newErrors);
        return false;
      }
    }

    if (step === 3) {
      if (!sessionName.trim()) {
        newErrors.sessionName = "Session name is required";
        setErrors(newErrors);
        return false;
      }
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step as Step);
  };

  const handleCreate = async () => {
    if (!validateStep(currentStep)) return;

    try {
      const result = await createSession.mutateAsync({
        workingDir,
        model,
      });

      // Save to recent directories
      try {
        const updated = [workingDir, ...recentDirectories]
          .filter((dir, index, self) => self.indexOf(dir) === index)
          .slice(0, 5);
        localStorage.setItem(
          RECENT_DIRECTORIES_KEY,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error("Failed to save recent directories:", e);
      }

      // Close dialog
      onOpenChange(false);

      // Navigate to new session
      navigateToSession(result.id);

      toast.success("Session created successfully");
    } catch (error) {
      // Error is handled by useCreateSession hook
      console.error("Failed to create session:", error);
    }
  };

  const handleRecentDirectorySelect = (path: string) => {
    setWorkingDir(path);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Select Working Directory";
      case 2:
        return "Choose Model";
      case 3:
        return "Configure Parameters";
      case 4:
        return "Review Configuration";
    }
  };

  const getStepIndicator = () => {
    return `${currentStep}/4`;
  };

  const isNextDisabled = () => {
    if (currentStep === 1 && !workingDir.trim()) return true;
    if (currentStep === 2 && !model) return true;
    if (currentStep === 3 && !sessionName.trim()) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getStepTitle()}</DialogTitle>
            <span className="text-sm text-muted-foreground font-medium">
              {getStepIndicator()}
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 1 && (
            <WorkingDirectoryPicker
              value={workingDir}
              onChange={setWorkingDir}
              error={workingDirError}
              recentDirectories={recentDirectories}
              onRecentDirectorySelect={handleRecentDirectorySelect}
            />
          )}

          {currentStep === 2 && (
            <ModelSelector value={model} onChange={setModel} />
          )}

          {currentStep === 3 && (
            <CliParametersForm
              sessionName={sessionName}
              onSessionNameChange={setSessionName}
              dangerouslySkipPermissions={dangerouslySkipPermissions}
              onDangerouslySkipPermissionsChange={setDangerouslySkipPermissions}
              permissionMode={permissionMode}
              onPermissionModeChange={setPermissionMode}
              diff={diff}
              onDiffChange={setDiff}
              errors={errors}
            />
          )}

          {currentStep === 4 && (
            <ConfirmStep
              workingDir={workingDir}
              model={model}
              sessionName={sessionName}
              cliParams={{
                dangerouslySkipPermissions,
                permissionMode,
                diff,
              }}
              gitInfo={gitInfo}
              onEdit={handleEdit}
            />
          )}
        </div>

        <DialogFooter>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={createSession.isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={currentStep === 4 ? handleCreate : handleNext}
            disabled={isNextDisabled() || createSession.isPending}
          >
            {createSession.isPending ? (
              "Creating..."
            ) : currentStep === 4 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Session
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
