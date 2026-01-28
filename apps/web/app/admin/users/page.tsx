import type { Metadata } from "next"
import { UserList } from "@/components/admin/users/user-list"

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users, block/unblock, and soft delete",
}

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400">Manage users, block/unblock accounts, and soft delete users</p>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <UserList />
        </div>
      </div>
    </div>
  )
}

