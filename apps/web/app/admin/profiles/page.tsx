import type { Metadata } from "next"
import { ProfileList } from "@/components/admin/profiles/profile-list"

export const metadata: Metadata = {
  title: "Profiles",
  description: "View and manage user profiles",
}

export default function ProfilesPage() {
  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profiles</h1>
          <p className="text-muted-foreground">View and manage user profiles</p>
        </div>

        <div className="border border-dashed border-border p-8 rounded-xl bg-muted">
          <ProfileList />
        </div>
      </div>
    </div>
  )
}

