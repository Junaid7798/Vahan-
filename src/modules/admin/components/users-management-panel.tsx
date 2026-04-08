"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { patchPortalAction } from "@/lib/demo/portal-client";
import { DemoUserAccount } from "@/lib/demo/portal-types";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UsersManagementPanelProps {
  users: DemoUserAccount[];
}

type UserDraftMap = Record<string, { approvalStatus: DemoUserAccount["approvalStatus"]; canViewFinancials: boolean; role: DemoUserAccount["role"] }>;

const filters = ["all", "pending_approval", "approved", "rejected", "disabled"] as const;

export function UsersManagementPanel({ users }: UsersManagementPanelProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("all");
  const [drafts, setDrafts] = useState<UserDraftMap>(() =>
    Object.fromEntries(
      users.map((user) => [user.id, { approvalStatus: user.approvalStatus, canViewFinancials: user.canViewFinancials, role: user.role }])
    )
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const visibleUsers = useMemo(
    () => users.filter((user) => activeFilter === "all" || user.approvalStatus === activeFilter),
    [activeFilter, users]
  );

  function saveUser(userId: string) {
    startTransition(async () => {
      try {
        await patchPortalAction("update_user", { userId, ...drafts[userId] });
        toast({ title: "User updated", description: "Role and access changes were saved." });
        router.refresh();
      } catch (error) {
        toast({
          title: "Update failed",
          description: error instanceof Error ? error.message : "The user could not be updated.",
          variant: "destructive",
        });
      }
    });
  }

  function toggleSelected(userId: string) {
    setSelectedIds((current) => (current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]));
  }

  function toggleAllVisible() {
    const visibleIds = visibleUsers.map((user) => user.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function bulkUpdate(approvalStatus: DemoUserAccount["approvalStatus"]) {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        await Promise.all(
          selectedIds.map((userId) =>
            patchPortalAction("update_user", {
              userId,
              ...drafts[userId],
              approvalStatus,
            })
          )
        );
        setDrafts((current) =>
          Object.fromEntries(
            Object.entries(current).map(([userId, value]) => [
              userId,
              selectedIds.includes(userId) ? { ...value, approvalStatus } : value,
            ])
          )
        );
        setSelectedIds([]);
        toast({ title: "Users updated", description: `${selectedIds.length} accounts were moved to ${approvalStatus.replaceAll("_", " ")}.` });
        router.refresh();
      } catch (error) {
        toast({
          title: "Bulk update failed",
          description: error instanceof Error ? error.message : "The selected users could not be updated.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Users Management</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {visibleUsers.length} visible users, {selectedIds.length} selected for bulk actions.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button key={filter} size="sm" type="button" variant={filter === activeFilter ? "default" : "outline"} onClick={() => setActiveFilter(filter)}>
                {filter === "all" ? "All users" : filter.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isPending || selectedIds.length === 0} size="sm" type="button" variant="outline" onClick={() => bulkUpdate("approved")}>
              Approve selected
            </Button>
            <Button disabled={isPending || selectedIds.length === 0} size="sm" type="button" variant="outline" onClick={() => bulkUpdate("rejected")}>
              Reject selected
            </Button>
            <Button disabled={isPending || selectedIds.length === 0} size="sm" type="button" variant="outline" onClick={() => bulkUpdate("disabled")}>
              Disable selected
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">
                <input
                  aria-label="Select all visible users"
                  checked={visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.includes(user.id))}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  onChange={toggleAllVisible}
                  type="checkbox"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Financials</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((user) => {
              const draft = drafts[user.id];
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      aria-label={`Select ${user.fullName}`}
                      checked={selectedIds.includes(user.id)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      onChange={() => toggleSelected(user.id)}
                      type="checkbox"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{user.fullName}</p>
                      <Badge variant="secondary">{user.phone}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.city}</TableCell>
                  <TableCell>
                    <Select value={draft.role} onValueChange={(value: DemoUserAccount["role"]) => setDrafts((current) => ({ ...current, [user.id]: { ...current[user.id], role: value } }))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={draft.approvalStatus} onValueChange={(value: DemoUserAccount["approvalStatus"]) => setDrafts((current) => ({ ...current, [user.id]: { ...current[user.id], approvalStatus: value } }))}>
                      <SelectTrigger className="w-[170px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_approval">Pending approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input checked={draft.canViewFinancials} className="h-4 w-4 accent-[hsl(var(--primary))]" onChange={(event) => setDrafts((current) => ({ ...current, [user.id]: { ...current[user.id], canViewFinancials: event.target.checked } }))} type="checkbox" />
                      Enabled
                    </label>
                  </TableCell>
                  <TableCell>
                    <Button disabled={isPending} size="sm" type="button" onClick={() => saveUser(user.id)}>
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
