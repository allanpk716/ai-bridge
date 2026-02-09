/**
 * ScopeSelector Component
 *
 * Allows users to select permission scope when approving a permission request.
 * Shows descriptions for each scope to help users understand the implications.
 *
 * Scopes:
 * - file-read: Read file contents only
 * - file-write: Read and modify files
 * - command-exec: Execute shell commands
 * - network: Allow network requests
 *
 * Reference:
 * - CONTEXT.md > "作用域选择 — 多选复选框 — 用户可选择特定文件或「全部允许」"
 */

import { File, FileEdit, Terminal, Globe } from "lucide-react";
import * as React from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type PermissionScope = "file-read" | "file-write" | "command-exec" | "network";

export interface ScopeSelectorProps {
  value: string;
  onChange: (scope: PermissionScope) => void;
  disabled?: boolean;
}

const scopeOptions = [
  {
    value: "file-read" as const,
    label: "File Read",
    description: "Read file contents only",
    icon: File,
  },
  {
    value: "file-write" as const,
    label: "File Write",
    description: "Read and modify files",
    icon: FileEdit,
  },
  {
    value: "command-exec" as const,
    label: "Command Execution",
    description: "Execute shell commands",
    icon: Terminal,
  },
  {
    value: "network" as const,
    label: "Network Access",
    description: "Allow network requests",
    icon: Globe,
  },
];

export const ScopeSelector = React.forwardRef<
  React.ElementRef<typeof RadioGroup>,
  ScopeSelectorProps
>(({ value, onChange, disabled = false }, ref) => {
  return (
    <RadioGroup
      ref={ref}
      value={value}
      onValueChange={(val) => onChange(val as PermissionScope)}
      disabled={disabled}
      className="gap-3"
    >
      {scopeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <div
            key={option.value}
            className={cn(
              "relative flex items-start space-x-3 rounded-lg border p-3 transition-all",
              "hover:bg-accent/50",
              isSelected && "border-primary bg-accent",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <RadioGroupItem
              value={option.value}
              id={`scope-${option.value}`}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1 space-y-1">
              <label
                htmlFor={`scope-${option.value}`}
                className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </label>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
});

ScopeSelector.displayName = "ScopeSelector";
