/**
 * PermissionModal Component
 *
 * Modal dialog for handling permission requests from Claude Code CLI.
 * Displays operation type, affected resources, scope selector, and action buttons.
 *
 * Features:
 * - Shows operation type and resource list
 * - Scope selector for choosing permission scope
 * - Approve and Deny actions
 * - Smart default scope based on operation type
 *
 * Reference:
 * - CONTEXT.md > "权限请求交互 > 弹窗时机: 嵌入式卡片"
 * - CONTEXT.md > "作用域选择 — 多选复选框"
 */

import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScopeSelector, type PermissionScope } from "@/components/permissions/ScopeSelector";
import type { Permission } from "@/types/api";

export interface PermissionModalProps {
  permission: Permission | null;
  isOpen: boolean;
  onApprove: (scope: PermissionScope) => void;
  onDeny: () => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const getScopeForOperation = (operation: string): PermissionScope => {
  const op = operation.toLowerCase();

  // Write operations need file-write scope
  if (op.includes("write") || op.includes("delete") || op.includes("modify") || op.includes("create")) {
    return "file-write";
  }

  // Read operations use file-read scope
  if (op.includes("read") || op.includes("view") || op.includes("list")) {
    return "file-read";
  }

  // Command execution
  if (op.includes("exec") || op.includes("run") || op.includes("command") || op.includes("shell")) {
    return "command-exec";
  }

  // Network operations
  if (op.includes("http") || op.includes("fetch") || op.includes("network") || op.includes("request")) {
    return "network";
  }

  // Default to least permissive
  return "file-read";
};

export const PermissionModal = React.forwardRef<
  React.ElementRef<typeof Dialog>,
  PermissionModalProps
>(({ permission, isOpen, onApprove, onDeny, onClose, isProcessing = false }, ref) => {
  const [selectedScope, setSelectedScope] = React.useState<PermissionScope>("file-read");

  // Set smart default scope when permission changes
  React.useEffect(() => {
    if (permission) {
      setSelectedScope(getScopeForOperation(permission.operation));
    }
  }, [permission]);

  const handleApprove = () => {
    if (permission) {
      onApprove(selectedScope);
    }
  };

  const handleDeny = () => {
    onDeny();
  };

  if (!permission) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} ref={ref}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Permission Request
          </DialogTitle>
          <DialogDescription>
            Claude Code is requesting permission to perform the following operation:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operation Type */}
          <div>
            <h4 className="text-sm font-medium mb-1">Operation</h4>
            <p className="text-sm text-muted-foreground">{permission.operation}</p>
          </div>

          {/* Resources List */}
          <div>
            <h4 className="text-sm font-medium mb-2">Resources</h4>
            <ScrollArea className="h-32 rounded-md border p-3">
              <ul className="space-y-1">
                {permission.resources.map((resource, index) => (
                  <li key={index} className="text-sm text-muted-foreground font-mono">
                    {resource}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          {/* Scope Selector */}
          <div>
            <h4 className="text-sm font-medium mb-2">Select permission scope</h4>
            <ScopeSelector
              value={selectedScope}
              onChange={setSelectedScope}
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDeny} disabled={isProcessing}>
            Deny
          </Button>
          <Button onClick={handleApprove} disabled={isProcessing}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

PermissionModal.displayName = "PermissionModal";
