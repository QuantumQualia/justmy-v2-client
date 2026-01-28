"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { Search, Loader2, Ban, Unlock, Trash2, RotateCcw, Edit } from "lucide-react"
import Link from "next/link"
import { usersService, UserResponseDto, ApiClientError } from "@/lib/services/users"
import { DataTable } from "@/components/ui/data-table"

const ITEMS_PER_PAGE = 20

export function UserList() {
  const [users, setUsers] = useState<UserResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debounce search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const fetchingRef = useRef(false)
  const lastFetchParamsRef = useRef<string>("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 750) // 750ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    // Create a unique key for this fetch request
    const fetchKey = `${currentPage}-${debouncedSearch}-${includeDeleted}`
    
    // Skip if we're already fetching with the same parameters
    if (fetchingRef.current && lastFetchParamsRef.current === fetchKey) {
      return
    }

    fetchingRef.current = true
    lastFetchParamsRef.current = fetchKey
    
    setLoading(true)
    setError(null)
    try {
      const response = await usersService.getUsers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        includeDeleted: includeDeleted,
      })
      
      // Only update if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        setUsers(response.data)
        setTotal(response.total)
        setTotalPages(response.totalPages)
      }
    } catch (err) {
      // Only set error if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load users. Please try again."
        setError(errorMessage)
        setUsers([])
      }
    } finally {
      if (lastFetchParamsRef.current === fetchKey) {
        setLoading(false)
        fetchingRef.current = false
      }
    }
  }, [currentPage, debouncedSearch, includeDeleted])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAction = async (
    userId: string,
    action: () => Promise<{ message: string }>
  ) => {
    setActionLoading(userId)
    try {
      await action()
      // Refresh the list after action
      fetchUsers()
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to perform action. Please try again."
      alert(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlock = async (id: string) => {
    if (confirm(`Are you sure you want to block this user?`)) {
      await handleAction(id, () => usersService.blockUser(id))
    }
  }

  const handleUnblock = async (id: string) => {
    if (confirm(`Are you sure you want to unblock this user?`)) {
      await handleAction(id, () => usersService.unblockUser(id))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this user? This action can be undone.`)) {
      await handleAction(id, () => usersService.deleteUser(id))
    }
  }

  const handleRestore = async (id: string) => {
    if (confirm(`Are you sure you want to restore this user?`)) {
      await handleAction(id, () => usersService.restoreUser(id))
    }
  }

  const getUserDisplayName = (user: UserResponseDto) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim()
    }
    return user.email
  }

  const columns = useMemo<ColumnDef<UserResponseDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={getUserDisplayName(user)}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="font-medium text-white">{getUserDisplayName(user)}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-slate-400">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const user = row.original
          if (user.deletedAt) {
            return (
              <Badge variant="destructive" className="bg-red-900/30 text-red-400 border-red-800">
                Deleted
              </Badge>
            )
          }
          if (user.isBlocked) {
            return (
              <Badge variant="destructive" className="bg-orange-900/30 text-orange-400 border-orange-800">
                Blocked
              </Badge>
            )
          }
          return (
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/50">
              Active
            </Badge>
          )
        },
      },
      {
        accessorKey: "profileCount",
        header: "Profile Count",
        cell: ({ row }) => {
          const count = row.original.profileCount
          return (
            <Badge
              variant={count > 0 ? "default" : "outline"}
              className={
                count > 0
                  ? "bg-emerald-900/50 text-emerald-400 border-emerald-800"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }
            >
              {count} {count === 1 ? "Profile" : "Profiles"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original
          const isLoading = actionLoading === user.id
          const isDeleted = !!user.deletedAt
          const isBlocked = user.isBlocked

          return (
            <div className="flex items-center justify-end gap-2">
              {!isDeleted && (
                <Link href={`/admin/users/${user.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                    title="Edit user"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {isDeleted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(user.id)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 border-emerald-700 text-emerald-400 hover:bg-emerald-950 disabled:opacity-50"
                  title="Restore user"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <>
                  {isBlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user.id)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 border-emerald-700 text-emerald-400 hover:bg-emerald-950 disabled:opacity-50"
                      title="Unblock user"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBlock(user.id)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-orange-400 hover:bg-slate-800 disabled:opacity-50"
                      title="Block user"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-50"
                    title="Delete user"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [actionLoading]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search users..."
            className="pl-8 bg-black/50 border-slate-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="include-deleted"
              checked={includeDeleted}
              onCheckedChange={(checked: boolean) => {
                setIncludeDeleted(checked)
                setCurrentPage(1)
              }}
              className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-700"
            />
            <Label htmlFor="include-deleted" className="text-sm text-slate-400 cursor-pointer">
              Include Deleted
            </Label>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        total={total}
        page={currentPage}
        pageSize={ITEMS_PER_PAGE}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={searchTerm ? "No users found matching your search" : "No users found"}
      />
    </div>
  )
}
