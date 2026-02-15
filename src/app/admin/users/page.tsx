"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2, UserPlus, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");

  const utils = api.useUtils();
  const { data: users, isLoading } = api.users.list.useQuery();

  const inviteMutation = api.users.invite.useMutation({
    onSuccess: () => {
      toast.success("User invited successfully");
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("user");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendClaimMutation = api.users.sendClaimEmail.useMutation({
    onSuccess: () => toast.success("Claim email sent"),
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole, sendEmail: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400">
            Manage user accounts and roles
          </p>
        </div>
        <Button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-full bg-[#C9725B] text-sm font-medium text-white hover:bg-[#B5624D]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {showInvite && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Invite New User</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
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
            <div>
              <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-gray-400">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="rounded-full bg-[#2D5A5A] text-sm font-medium text-white hover:bg-[#2D5A5A]/80"
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
        <div className="py-12 text-center text-sm text-gray-400">
          No users found. Invite your first user above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5">
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
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-gray-300">
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
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendClaimMutation.mutate({ email: user.email })}
                        disabled={sendClaimMutation.isPending}
                        className="rounded p-1 text-xs text-[#C9725B] hover:bg-white/10"
                        title="Send claim email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateRoleMutation.mutate({
                            profileId: user.id,
                            role: user.role === "admin" ? "user" : "admin",
                          })
                        }
                        disabled={updateRoleMutation.isPending}
                        className="rounded p-1 text-xs text-[#5B8A8A] hover:bg-white/10"
                        title={user.role === "admin" ? "Demote to user" : "Promote to admin"}
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
