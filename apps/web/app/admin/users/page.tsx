import type { Metadata } from "next"
import { AdminPage, AdminPanel } from "@/components/admin/admin-page"
import { UserList } from "@/components/admin/users/user-list"

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users, block/unblock, and soft delete",
}

export default function UsersPage() {
  return (
    <AdminPage
      title="Users"
      description="Manage accounts, block or restore access, and sign in as a user when you need to."
    >
      <AdminPanel>
        <UserList />
      </AdminPanel>
    </AdminPage>
  )
}
