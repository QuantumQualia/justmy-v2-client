import type { Metadata } from "next"
import { AdminPage, AdminPanel } from "@/components/admin/admin-page"
import { ProfileList } from "@/components/admin/profiles/profile-list"

export const metadata: Metadata = {
  title: "Profiles",
  description: "View and manage user profiles",
}

export default function ProfilesPage() {
  return (
    <AdminPage
      title="Profiles"
      description="View profiles. Sponsor assignments for NewsSTAND and Sky live on each market."
    >
      <AdminPanel>
        <ProfileList />
      </AdminPanel>
    </AdminPage>
  )
}
