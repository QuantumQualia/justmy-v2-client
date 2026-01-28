import type { Metadata } from "next"
import { ProfileList } from "@/components/admin/profiles/profile-list"

export const metadata: Metadata = {
  title: "Profiles",
  description: "View and manage user profiles",
}

export default function ProfilesPage() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Profiles</h1>
          <p className="text-slate-400">View and manage user profiles</p>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <ProfileList />
        </div>
      </div>
    </div>
  )
}

