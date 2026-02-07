import { GitBranch, Pencil, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GitInfo {
  branch: string;
}

interface CliParams {
  dangerouslySkipPermissions: boolean;
  permissionMode: string;
  diff: boolean;
}

interface ConfirmStepProps {
  workingDir: string;
  model: "haiku" | "sonnet" | "opus";
  sessionName: string;
  cliParams: CliParams;
  gitInfo?: GitInfo;
  onEdit: (step: number) => void;
}

/**
 * ConfirmStep component
 *
 * Final step in create session wizard showing configuration summary.
 *
 * Features:
 * - Display all selections with edit buttons
 * - Show working directory with folder name
 * - Show model badge
 * - Show session name
 * - Show CLI parameters
 * - Show git information (if applicable)
 */
export function ConfirmStep({
  workingDir,
  model,
  sessionName,
  cliParams,
  gitInfo,
  onEdit,
}: ConfirmStepProps) {
  // Extract folder name from path
  const folderName = workingDir.split("\\").pop() || workingDir.split("/").pop() || workingDir;

  // Get model display name
  const modelNames = {
    haiku: "Haiku",
    sonnet: "Sonnet",
    opus: "Opus",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review your session configuration</h2>
        <p className="text-sm text-muted-foreground">
          Check everything looks good before creating your session
        </p>
      </div>

      {/* Working Directory */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Working Directory</h3>
              </div>
              <p className="text-base font-semibold">{folderName}</p>
              <p className="text-xs text-muted-foreground">{workingDir}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(1)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit working directory</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Model */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Model</h3>
              <Badge variant="secondary" className="text-base">
                {modelNames[model]}
              </Badge>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(2)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit model selection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Session Name */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Session Name</h3>
              <p className="text-base">{sessionName || "Unnamed Session"}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(3)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit session name and parameters</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* CLI Parameters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">CLI Parameters</h3>
              <div className="flex flex-wrap gap-2">
                {cliParams.dangerouslySkipPermissions && (
                  <Badge variant="outline">--dangerously-skip-permissions</Badge>
                )}
                <Badge variant="outline">--permission-mode={cliParams.permissionMode}</Badge>
                {cliParams.diff && <Badge variant="outline">--diff</Badge>}
                {!cliParams.dangerouslySkipPermissions && !cliParams.diff && (
                  <p className="text-sm text-muted-foreground">No additional parameters</p>
                )}
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(3)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit CLI parameters</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Git Information */}
      {gitInfo ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Git Repository</h3>
                <p className="text-sm text-muted-foreground">
                  Branch: <span className="font-medium">{gitInfo.branch}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Not a git repository</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
