import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionListFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "running" | "stopped";
  onStatusFilterChange: (filter: "all" | "running" | "stopped") => void;
  sortBy: "lastActivity" | "createdAt";
  onSortChange: (sort: "lastActivity" | "createdAt") => void;
}

/**
 * SessionListFilters component
 *
 * Provides filtering and sorting controls for the session list:
 * - Search input (filters by session name/id)
 * - Status filter (all/running/stopped)
 * - Sort options (last activity/created time)
 */
export function SessionListFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: SessionListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter button group */}
      <div className="flex gap-1">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("all")}
          className="min-w-[60px]"
        >
          All
        </Button>
        <Button
          variant={statusFilter === "running" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("running")}
          className="min-w-[60px]"
        >
          Running
        </Button>
        <Button
          variant={statusFilter === "stopped" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("stopped")}
          className="min-w-[60px]"
        >
          Stopped
        </Button>
      </div>

      {/* Sort dropdown */}
      <select
        value={sortBy}
        onChange={(e) =>
          onSortChange(e.target.value as "lastActivity" | "createdAt")
        }
        className={cn(
          "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
          "shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "cursor-pointer"
        )}
      >
        <option value="lastActivity">Last activity</option>
        <option value="createdAt">Created time</option>
      </select>
    </div>
  );
}
