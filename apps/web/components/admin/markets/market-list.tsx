"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Edit, Trash2, Plus, Search } from "lucide-react"
import { marketsService, MarketResponseDto, ApiClientError } from "@/lib/services/markets"
import { DataTable } from "@/components/ui/data-table"

const ITEMS_PER_PAGE = 20

export function MarketList() {
  const [markets, setMarkets] = useState<MarketResponseDto[]>([])
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

  // Fetch markets from API
  const fetchMarkets = useCallback(async () => {
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
      const response = await marketsService.getMarkets({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        includeParent: true,
        orderBy: "id:desc",
      })
      
      // Only update if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        setMarkets(response.data)
        setTotal(response.total)
        setTotalPages(response.totalPages)
      }
    } catch (err) {
      // Only set error if this is still the latest fetch
      if (lastFetchParamsRef.current === fetchKey) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load markets. Please try again."
        setError(errorMessage)
        setMarkets([])
      }
    } finally {
      if (lastFetchParamsRef.current === fetchKey) {
        setLoading(false)
        fetchingRef.current = false
      }
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchMarkets()
  }, [fetchMarkets])

  const handleDelete = async (id: number) => {
    if (confirm(`Are you sure you want to delete market #${id}?`)) {
      try {
        await marketsService.deleteMarket(id)
        // Refresh the list after deletion
        fetchMarkets()
      } catch (err) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to delete market. Please try again."
        alert(errorMessage)
      }
    }
  }

  // Map API status to display status
  const getDisplayStatus = (status: string): "Active" | "Inactive" => {
    if (status === "ACTIVE") return "Active"
    if (status === "INACTIVE") return "Inactive"
    return "Active" // Default
  }

  const columns = useMemo<ColumnDef<MarketResponseDto>[]>(
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
        header: "Name",
        cell: ({ row }) => {
          const market = row.original
          return (
            <span className="font-medium text-lg text-white">
              {market.city || market.name || market.siteTitle}
            </span>
          )
        },
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) => (
          <span className="text-slate-400">{row.original.state || "-"}</span>
        ),
      },
      {
        accessorKey: "parent",
        header: "Parent Market",
        cell: ({ row }) => {
          const parent = row.original.parent
          return (
            <span className="text-slate-400">
              {parent ? (
                parent.city || parent.name || parent.siteTitle || `Market #${parent.id}`
              ) : (
                <span className="opacity-30">-</span>
              )}
            </span>
          )
        },
      },
      {
        accessorKey: "zipCount",
        header: () => <div className="text-right">Zip Count</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {row.original.zipCount || 0}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const displayStatus = getDisplayStatus(row.original.status)
          return (
            <Badge
              variant={displayStatus === "Active" ? "default" : "outline"}
              className={
                displayStatus === "Active"
                  ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/50"
                  : "text-slate-400 border-slate-700"
              }
            >
              {displayStatus}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const market = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <Link href={`/admin/markets/${market.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-400 hover:text-white hover:bg-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(market.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
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
            placeholder="Search markets..."
            className="pl-8 bg-black/50 border-slate-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/admin/markets/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Market
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={markets}
        loading={loading}
        error={error}
        total={total}
        page={currentPage}
        pageSize={ITEMS_PER_PAGE}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={searchTerm ? "No markets found matching your search" : "No markets found"}
      />
    </div>
  )
}
