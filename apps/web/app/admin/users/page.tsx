import type { Metadata } from "next"
import { UserList } from "@/components/admin/users/user-list"

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users, block/unblock, and soft delete",
}

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage users, block/unblock accounts, and soft delete users</p>
        </div>

        <div className="border border-dashed border-border p-8 rounded-xl bg-muted">
          <UserList />
        </div>
      </div>
    </div>
  )
}

