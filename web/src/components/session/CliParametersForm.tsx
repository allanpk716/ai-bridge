import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface CliParametersFormProps {
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  dangerouslySkipPermissions: boolean;
  onDangerouslySkipPermissionsChange: (value: boolean) => void;
  permissionMode: "normal" | "strict";
  onPermissionModeChange: (mode: "normal" | "strict") => void;
  diff: boolean;
  onDiffChange: (value: boolean) => void;
  errors: Record<string, string>;
}

/**
 * CliParametersForm component
 *
 * Form for configuring CLI startup parameters for a new session.
 *
 * Features:
 * - Session name with auto-generation
 * - Common parameters (always visible)
 * - Advanced parameters (expandable)
 * - Tooltips for each parameter
 */
export function CliParametersForm({
  sessionName,
  onSessionNameChange,
  dangerouslySkipPermissions,
  onDangerouslySkipPermissionsChange,
  permissionMode,
  onPermissionModeChange,
  diff,
  onDiffChange,
  errors,
}: CliParametersFormProps) {
  const [advancedExpanded, setAdvancedExpanded] = useState(true);

  return (
    <div className="space-y-6">
      {/* Common Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Common Parameters
        </h3>

        {/* Session Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="session-name">
              Session Name
              <span className="text-destructive ml-1" aria-label="必填项">
                *
              </span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>A name to identify this session</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="session-name"
            name="sessionName"
            value={sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            placeholder="Session name"
            required
            aria-required="true"
            aria-invalid={errors.sessionName ? 'true' : 'false'}
            aria-describedby={errors.sessionName ? 'session-name-error' : undefined}
            className={errors.sessionName ? "border-destructive" : ""}
          />
          {errors.sessionName && (
            <p id="session-name-error" className="text-sm text-destructive" role="alert">
              {errors.sessionName}
            </p>
          )}
        </div>

        {/* --dangerously-skip-permissions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="skip-permissions" className="cursor-pointer">
              Skip Permissions
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip all permission prompts. Use with caution.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="skip-permissions"
            checked={dangerouslySkipPermissions}
            onCheckedChange={onDangerouslySkipPermissionsChange}
            aria-labelledby="skip-permissions-label"
          />
        </div>

        {/* --permission-mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="permission-mode">Permission Mode</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    normal: prompt for permissions; strict: require explicit
                    approval
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={permissionMode}
            onValueChange={(value: "normal" | "strict") =>
              onPermissionModeChange(value)
            }
          >
            <SelectTrigger id="permission-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="strict">Strict</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* --diff */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="diff" className="cursor-pointer">Show Diff Output</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show diff output when files are modified</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="diff"
            checked={diff}
            onCheckedChange={onDiffChange}
            aria-labelledby="diff-label"
          />
        </div>
      </div>

      {/* Advanced Parameters */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between px-0 h-auto"
          onClick={() => setAdvancedExpanded(!advancedExpanded)}
          aria-expanded={advancedExpanded}
          aria-controls="advanced-parameters"
        >
          <h3 className="text-sm font-medium text-muted-foreground">
            Advanced Parameters
          </h3>
          {advancedExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        {advancedExpanded && (
          <div id="advanced-parameters" className="pl-4 border-l-2 border-muted text-sm text-muted-foreground" role="region">
            <p>More advanced options coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
