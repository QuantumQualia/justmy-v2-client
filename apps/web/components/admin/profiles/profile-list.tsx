"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"
import { profilesService, ProfileResponseDto, ApiClientError } from "@/lib/services/profiles"
import { DataTable } from "@/components/ui/data-table"

const ITEMS_PER_PAGE = 20

export function ProfileList() {
  const [profiles, setProfiles] = useState<ProfileResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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

  // Fetch profiles from API
  const fetchProfiles = useCallback(async () => {
    // Create a unique key for this fetch request
    const fetchKey = `${currentPage}-${debouncedSearch}`
    
    // Skip if we're already fetching with the same parameters
    if (fetchingRef.current && lastFetchParamsRef.current === fetchKey) {
      return
    }

    fetchingRef.current = true
    lastFetchParamsRef.current = fetchKey
    
    setLoading(true)
    setError(null)
    try {
      const response = await profilesService.getProfiles({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      })
      
      // Only update if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        setProfiles(response.data)
        setTotal(response.total)
        setTotalPages(response.totalPages)
      }
    } catch (err) {
      // Only set error if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load profiles. Please try again."
        setError(errorMessage)
        setProfiles([])
      }
    } finally {
      if (lastFetchParamsRef.current === fetchKey) {
        setLoading(false)
        fetchingRef.current = false
      }
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const getPrimaryMember = (profile: ProfileResponseDto) => {
    const defaultMember = profile.members.find((m) => m.isDefault)
    return defaultMember || profile.members[0] || null
  }

  const columns = useMemo<ColumnDef<ProfileResponseDto>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Profile Name",
        cell: ({ row }) => {
          const profile = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium text-white">{profile.name}</span>
              <span className="text-xs text-slate-400">/{profile.slug}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "type",
        header: "Profile Type",
        cell: ({ row }) => {
          const profile = row.original
          return (
            <Badge variant="outline" className="border-slate-600 text-slate-300 w-fit">
              {profile.type}
            </Badge>
          )
        },
      },
      {
        accessorKey: "members",
        header: "Primary Member",
        cell: ({ row }) => {
          const primaryMember = getPrimaryMember(row.original)
          if (!primaryMember) {
            return <span className="text-slate-500 text-sm">No members</span>
          }
          const memberName = primaryMember.firstName || primaryMember.lastName
            ? `${primaryMember.firstName || ""} ${primaryMember.lastName || ""}`.trim()
            : primaryMember.email
          return (
            <div className="flex flex-col">
              <span className="text-white text-sm">{memberName}</span>
              <span className="text-xs text-slate-400">{primaryMember.email}</span>
              {primaryMember.isDefault && (
                <Badge variant="outline" className="mt-1 w-fit text-xs border-emerald-700 text-emerald-400">
                  Default
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const profile = row.original
          return (
            <div className="flex flex-col text-sm">
              {profile.zipCode && (
                <span className="text-white">ZIP: {profile.zipCode}</span>
              )}
              {profile.marketId && (
                <span className="text-xs text-slate-400">Market: {profile.marketId}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "subscription",
        header: "Subscription",
        cell: ({ row }) => {
          const subscription = row.original.subscription
          if (!subscription) {
            return <span className="text-slate-500 text-sm">-</span>
          }
          return (
            <div className="flex flex-col">
              <Badge
                variant={subscription.status === "ACTIVE" ? "default" : "outline"}
                className={
                  subscription.status === "ACTIVE"
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/50 w-fit"
                    : "border-slate-700 text-slate-400 w-fit"
                }
              >
                {subscription.status}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "wallet",
        header: "Credits",
        cell: ({ row }) => {
          const wallet = row.original.wallet
          if (!wallet) {
            return <span className="text-slate-500 text-sm">-</span>
          }
          return (
            <div className="flex flex-col text-sm">
              <span className="text-white">Balance: {wallet.balance}</span>
              <span className="text-xs text-slate-400">Lifetime: {wallet.lifetime}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-slate-400 text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search profiles..."
            className="pl-8 bg-black/50 border-slate-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={profiles}
        loading={loading}
        error={error}
        total={total}
        page={currentPage}
        pageSize={ITEMS_PER_PAGE}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={searchTerm ? "No profiles found matching your search" : "No profiles found"}
      />
    </div>
  )
}
