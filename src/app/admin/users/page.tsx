"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2, UserPlus, Mail, Shield, User, Trash2, Users, CheckSquare, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  useEffect(() => { document.title = "Users — CHW360"; }, []);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: users, isLoading } = api.users.list.useQuery();

  const inviteMutation = api.users.invite.useMutation({
    onSuccess: () => {
      toast.success("User invited successfully");
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("user");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendClaimMutation = api.users.sendClaimEmail.useMutation({
    onSuccess: () => toast.success("Claim email sent"),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      setDeleteConfirm(null);
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMutation.mutate({
      email: inviteEmail,
      displayName: inviteName.trim() || undefined,
      role: inviteRole,
      sendEmail: true,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400">Manage user accounts and roles</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`hidden text-xs sm:inline-flex ${selectMode ? "text-[#7AACAC]" : "text-gray-400 hover:text-white"}`}
            onClick={() => {
              if (selectMode) { setSelectedUsers(new Set()); }
              setSelectMode(!selectMode);
            }}
          >
            <CheckSquare className="mr-1.5 h-4 w-4" />
            {selectMode ? "Cancel" : "Select"}
          </Button>
          <Button
            onClick={() => {
              if (showInvite) {
                setInviteEmail("");
                setInviteName("");
                setInviteRole("user");
              }
              setShowInvite(!showInvite);
            }}
            className="rounded-full bg-[#C9725B] text-sm font-medium text-white hover:bg-[#B5624D]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Invite User</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        </div>
      </div>

      {showInvite && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Invite New User</h2>
          <form onSubmit={handleInvite} className="space-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:space-y-0">
            <div className="sm:min-w-[200px] sm:flex-1">
              <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-gray-400">
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="border-white/10 bg-white/5 text-white placeholder-gray-500"
              />
            </div>
            <div className="sm:w-[180px]">
              <label htmlFor="invite-name" className="mb-1 block text-xs font-medium text-gray-400">
                Name <span className="text-gray-600">(optional)</span>
              </label>
              <Input
                id="invite-name"
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
                maxLength={100}
                className="border-white/10 bg-white/5 text-white placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-gray-400">
                Role
              </label>
              <div className="relative">
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                  className="h-9 w-full appearance-none rounded-md border border-white/10 bg-white/5 pl-3 pr-8 text-sm text-white sm:w-auto"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="w-full rounded-full bg-[#2D5A5A] text-sm font-medium text-white hover:bg-[#2D5A5A]/80 sm:w-auto"
            >
              {inviteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inviting...</>
              ) : (
                "Send Invite"
              )}
            </Button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#5B8A8A]" />
        </div>
      ) : !users?.length ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No users found. Invite your first user above.</p>
        </div>
      ) : (
        <>
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-[#2D5A5A]/15 px-3 py-2 text-sm">
            <span className="font-medium text-[#5B8A8A]">{selectedUsers.size} selected</span>
            <div className="flex-1" />
            <button className="text-gray-500 hover:text-white" onClick={() => { setSelectedUsers(new Set()); setSelectMode(false); }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Mobile card layout */}
        <div className="space-y-3 sm:hidden">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{user.displayName ?? user.email}</p>
                  {user.displayName && (
                    <p className="mt-0.5 truncate text-xs text-gray-400">{user.email}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-[#2D5A5A]/20 text-[#5B8A8A]"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {user.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => sendClaimMutation.mutate({ email: user.email })}
                    disabled={sendClaimMutation.isPending}
                    className="rounded p-2 text-[#C9725B] hover:bg-white/10"
                    title="Send claim email"
                    aria-label="Send claim email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  {deleteConfirm === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate({ profileId: user.id })}
                        disabled={deleteMutation.isPending}
                        className="rounded px-1.5 py-0.5 text-xs font-medium text-red-400 hover:bg-red-400/10"
                      >
                        {deleteMutation.isPending ? "..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-white/10"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="rounded p-2 text-red-400/60 hover:bg-white/10 hover:text-red-400"
                      title="Delete user"
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table layout */}
        <div className="hidden overflow-x-auto rounded-lg border border-white/10 sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5">
                {selectMode && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={users!.length > 0 && users!.every((u) => selectedUsers.has(u.id))}
                      onChange={() => {
                        if (users!.every((u) => selectedUsers.has(u.id))) {
                          setSelectedUsers(new Set());
                        } else {
                          setSelectedUsers(new Set(users!.map((u) => u.id)));
                        }
                      }}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-[#2D5A5A]"
                      aria-label="Select all users"
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium text-gray-400">Email</th>
                <th className="px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-400">Role</th>
                <th className="px-4 py-3 font-medium text-gray-400">Joined</th>
                <th className="px-4 py-3 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  {selectMode && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => {
                          setSelectedUsers((prev) => {
                            const next = new Set(prev);
                            if (next.has(user.id)) next.delete(user.id);
                            else next.add(user.id);
                            return next;
                          });
                        }}
                        className="h-3.5 w-3.5 cursor-pointer rounded accent-[#2D5A5A]"
                        aria-label={`Select ${user.email}`}
                      />
                    </td>
                  )}
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="max-w-[150px] truncate px-4 py-3 text-gray-300">
                    {user.displayName ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-[#2D5A5A]/20 text-[#5B8A8A]"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendClaimMutation.mutate({ email: user.email })}
                        disabled={sendClaimMutation.isPending}
                        className="rounded p-2 text-xs text-[#C9725B] hover:bg-white/10"
                        title="Send claim email"
                        aria-label="Send claim email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate({ profileId: user.id })}
                            disabled={deleteMutation.isPending}
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-red-400 hover:bg-red-400/10"
                          >
                            {deleteMutation.isPending ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="rounded p-2 text-xs text-red-400/60 hover:bg-white/10 hover:text-red-400"
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
