"use client";

import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export function ProfileCard({ email }: { email: string }) {
  const { data: profile, isLoading } = api.profile.get.useQuery();
  const utils = api.useUtils();

  const [displayName, setDisplayName] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setIsDirty(false);
    }
  }, [profile]);

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      setIsDirty(false);
      void utils.profile.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateProfile.mutate({ displayName: displayName.trim() });
  };

  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-white/[0.07]">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-white/[0.07]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="h-4 w-4 text-[#5B8A8A]" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="text-sm font-medium" style={{ color: "#8AACAC" }}>
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={displayName}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setDisplayName(e.target.value);
                setIsDirty(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isDirty) handleSave();
            }}
            placeholder="Your name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#2D5A5A]/50 focus:outline-none focus:ring-1 focus:ring-[#2D5A5A]/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Email</label>
          <p className="text-sm text-gray-300">{email}</p>
        </div>

        {profile?.role && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Role</label>
            <p className="text-sm capitalize text-gray-300">{profile.role}</p>
          </div>
        )}

        {isDirty && (
          <Button
            className="w-full gap-1.5"
            style={{ backgroundColor: "#C9725B" }}
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
