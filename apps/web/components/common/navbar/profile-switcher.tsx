"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select";
import { useProfileStore } from "@/lib/store/profile-store";

/**
 * Profile Switcher Component
 * 
 * Shows only the profile photo (like old site styles).
 * Clicking opens a dropdown to switch between profiles.
 */
export function ProfileSwitcher() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.data);
  const [isOpen, setIsOpen] = React.useState(false);

  // Mock profiles for now - in production, this would come from an API
  const profiles = React.useMemo(() => {
    const currentProfile = profile.slug
      ? {
        id: profile.id?.toString() || "1",
        slug: profile.slug,
        name: profile.name || "My Profile",
        photo: profile.photo,
      }
      : null;

    // Add mock additional profiles for demonstration
    const mockProfiles = [
      currentProfile,
    ].filter(Boolean);

    return mockProfiles;
  }, [profile]);

  const currentProfile = profiles[0];

  const handleProfileChange = (profileSlug: string) => {
    if (profileSlug === "new") {
      // Navigate to create new profile
      // router.push("/mycard/edit");
    } else {
      // Navigate to profile
      router.push(`/${profileSlug}`);
    }
    setIsOpen(false);
  };

  if (!currentProfile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/mycard/edit")}
        className="h-10 w-10 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <User className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Select
      value={currentProfile.slug}
      onValueChange={handleProfileChange}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="h-10 w-10 p-0 border-0 bg-transparent hover:bg-slate-800 rounded-full focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-black">
        {currentProfile.photo ? (
          <img
            src={currentProfile.photo}
            alt={currentProfile.name}
            className="h-10 w-10 rounded-full object-cover cursor-pointer"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center cursor-pointer">
            <User className="h-5 w-5 text-emerald-400" />
          </div>
        )}
      </SelectTrigger>
      <SelectContent className="min-w-[200px] bg-slate-900 border-slate-800 text-slate-100 dark:bg-slate-900">
        {profiles.map((p) => (
          <SelectItem
            key={p!.id}
            value={p!.slug}
            className="cursor-pointer text-slate-200 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              {p!.photo ? (
                <img
                  src={p!.photo}
                  alt={p!.name}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <User className="h-3 w-3 text-emerald-400" />
                </div>
              )}
              <span>{p!.name}</span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="new" className="cursor-pointer text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 focus:bg-slate-800 focus:text-emerald-300 dark:text-emerald-400 dark:hover:bg-slate-800 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New Profile</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
