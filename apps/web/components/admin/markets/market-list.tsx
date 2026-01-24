"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { marketsService, MarketResponseDto, ApiClientError } from "@/lib/services/markets"

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
        orderBy: "createdAt:desc",
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

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-md border border-slate-800 bg-slate-900/50 text-white">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-950">
              <TableHead className="text-slate-400">ID</TableHead>
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">State</TableHead>
              <TableHead className="text-slate-400">Parent Market</TableHead>
              <TableHead className="text-right text-slate-400">Zip Count</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading markets...
                  </div>
                </TableCell>
              </TableRow>
            ) : markets.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  {searchTerm ? "No markets found matching your search" : "No markets found"}
                </TableCell>
              </TableRow>
            ) : (
              markets.map((market) => {
                const displayStatus = getDisplayStatus(market.status)
                return (
                  <TableRow key={market.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-mono text-xs text-slate-500">#{market.id}</TableCell>
                    <TableCell className="font-medium text-lg text-white">{market.city || market.name || market.siteTitle}</TableCell>
                    <TableCell className="text-slate-400">{market.state || "-"}</TableCell>
                    <TableCell className="text-slate-400">
                      {market.parent ? (
                        <span>{market.parent.city || market.parent.name || market.parent.siteTitle || `Market #${market.parent.id}`}</span>
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {market.zipCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} markets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={
                      currentPage === pageNum
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

