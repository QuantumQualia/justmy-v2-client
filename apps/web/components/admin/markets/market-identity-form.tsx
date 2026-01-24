"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { marketsService, MarketResponseDto, ApiClientError } from "@/lib/services/markets"
import { Loader2 } from "lucide-react"

type MarketIdentityFormData = {
  name: string
  state: string
  urlSlug: string
  parentMarket: string
  status: "Active" | "Inactive"
  site?: string
  siteTitle?: string
}

type MarketIdentityFormProps = {
  initialData?: Partial<MarketIdentityFormData>
  onSubmit?: (data: MarketIdentityFormData) => void
  onChange?: (data: MarketIdentityFormData) => void
  currentMarketId?: number | string // Exclude this market from parent options (for edit mode)
}

export function MarketIdentityForm({ initialData, onSubmit, onChange, currentMarketId }: MarketIdentityFormProps) {
  const [parentMarkets, setParentMarkets] = useState<MarketResponseDto[]>([])
  const [loadingParents, setLoadingParents] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedParent, setSelectedParent] = useState<MarketResponseDto | null>(null)
  const selectedParentRef = useRef<MarketResponseDto | null>(null)
  const [formData, setFormData] = useState<MarketIdentityFormData>({
    name: initialData?.name || "",
    state: initialData?.state || "",
    urlSlug: initialData?.urlSlug || "",
    parentMarket: initialData?.parentMarket || "",
    status: initialData?.status || "Active",
    site: initialData?.site || "",
    siteTitle: initialData?.siteTitle || "",
  })
  const isInitialMount = useRef(true)
  const isSyncingFromParent = useRef(false)
  const prevInitialDataRef = useRef<string>("")
  const fetchingParentsRef = useRef<string | null>(null)
  const fetchingSelectedParentRef = useRef<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update ref when selectedParent changes
  useEffect(() => {
    selectedParentRef.current = selectedParent
  }, [selectedParent])

  // Fetch parent markets based on search query
  useEffect(() => {
    // Create a unique key for this fetch
    const fetchKey = `${debouncedSearch || ""}-${currentMarketId || ""}`
    
    // Skip if we're already fetching with the same parameters
    if (fetchingParentsRef.current === fetchKey) {
      return
    }

    // Set ref immediately to prevent duplicate calls
    fetchingParentsRef.current = fetchKey
    const effectFetchKey = fetchKey
    let isMounted = true

    const fetchParentMarkets = async () => {
      setLoadingParents(true)
      try {
        // Fetch top-level markets with search query
        const response = await marketsService.getMarkets({
          limit: 50, // Limit to top 50 results for performance
          search: debouncedSearch || undefined,
          onlyParents: true,
        })
        
        // Only update state if this is still the active fetch
        // (don't check isMounted - cleanup runs in Strict Mode even for successful requests)
        if (fetchingParentsRef.current === effectFetchKey) {
          // Filter to only top-level markets (no parentId) and exclude current market if editing
          let topLevelMarkets = response.data.filter(
            (market) => !market.parentId && market.id !== currentMarketId
          )

          // If we have a selected parent and it's not in the results, add it at the top
          const currentSelectedParent = selectedParentRef.current
          if (currentSelectedParent && !topLevelMarkets.find(m => m.id === currentSelectedParent.id)) {
            topLevelMarkets = [currentSelectedParent, ...topLevelMarkets]
          }
          
          setParentMarkets(topLevelMarkets)
        }
      } catch (error) {
        // Only update state if this is still the active fetch
        if (fetchingParentsRef.current === effectFetchKey) {
          console.error("Failed to fetch parent markets:", error)
          // On error, keep existing markets or use empty array
          const currentSelectedParent = selectedParentRef.current
          if (currentSelectedParent) {
            setParentMarkets([currentSelectedParent])
          } else {
            setParentMarkets([])
          }
        }
      } finally {
        // Always update loading state if this is still the active fetch
        // (don't check isMounted - cleanup runs in Strict Mode even for successful requests)
        if (fetchingParentsRef.current === effectFetchKey) {
          setLoadingParents(false)
          fetchingParentsRef.current = null
        }
      }
    }

    // Always fetch, even on initial mount
    fetchParentMarkets()

    return () => {
      isMounted = false
      // Don't clear the ref in cleanup - let it be cleared when fetch completes
      // This prevents the second Strict Mode run from proceeding
    }
  }, [debouncedSearch, currentMarketId])

  // Fetch selected parent market when formData.parentMarket changes
  useEffect(() => {
    const parentMarketId = formData.parentMarket && formData.parentMarket !== "none" ? formData.parentMarket : null
    
    // Skip if we're already fetching this parent market
    if (fetchingSelectedParentRef.current === parentMarketId) {
      return
    }

    // Skip if parentMarketId is null (no parent selected)
    if (!parentMarketId) {
      setSelectedParent(null)
      fetchingSelectedParentRef.current = null
      return
    }

    fetchingSelectedParentRef.current = parentMarketId
    const effectParentMarketId = parentMarketId
    let isMounted = true

    const fetchSelectedParent = async () => {
      // Double-check we're still the active fetch
      if (fetchingSelectedParentRef.current !== effectParentMarketId) {
        return
      }
      
      try {
        const market = await marketsService.getMarketById(effectParentMarketId)
        
        // Only update state if this is still the active fetch
        // (don't check isMounted - cleanup runs in Strict Mode even for successful requests)
        if (fetchingSelectedParentRef.current === effectParentMarketId) {
          setSelectedParent(market)
        }
      } catch (error) {
        // Only update state if this is still the active fetch
        if (fetchingSelectedParentRef.current === effectParentMarketId) {
          console.error("Failed to fetch selected parent market:", error)
          setSelectedParent(null)
        }
      } finally {
        // Only clear ref if this is still the active fetch
        if (fetchingSelectedParentRef.current === effectParentMarketId) {
          fetchingSelectedParentRef.current = null
        }
      }
    }

    fetchSelectedParent()

    return () => {
      isMounted = false
      // Don't clear the ref in cleanup - let it be cleared when fetch completes
      // This prevents the second Strict Mode run from proceeding
    }
  }, [formData.parentMarket])

  // Sync formData when initialData changes (only if it actually changed)
  useEffect(() => {
    // Create a string representation of initialData to compare
    const currentInitialDataStr = JSON.stringify(initialData || {})
    
    // Only sync if initialData actually changed from previous value
    if (prevInitialDataRef.current !== currentInitialDataStr) {
      isSyncingFromParent.current = true
      prevInitialDataRef.current = currentInitialDataStr
      
      if (initialData) {
        setFormData((prev) => ({
          name: initialData.name ?? prev.name,
          state: initialData.state ?? prev.state,
          urlSlug: initialData.urlSlug ?? prev.urlSlug,
          parentMarket: initialData.parentMarket ?? prev.parentMarket,
          status: initialData.status ?? prev.status,
          site: initialData.site ?? prev.site,
          siteTitle: initialData.siteTitle ?? prev.siteTitle,
        }))
      }
      
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromParent.current = false
      }, 0)
    }
    
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  // Call onChange when formData changes (but not on initial mount or when syncing from parent)
  useEffect(() => {
    if (!isInitialMount.current && !isSyncingFromParent.current && onChange) {
      // Use a small delay to ensure state has updated
      const timeoutId = setTimeout(() => {
        onChange(formData)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [formData, onChange])

  const updateFormData = (updates: Partial<MarketIdentityFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...updates }
      return updated
    })
  }

  const handleNameChange = (name: string) => {
    updateFormData({
      name,
      urlSlug: formData.urlSlug || generateSlug(name),
    })
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-white">Market Identity</CardTitle>
        <CardDescription className="text-slate-400">
          Configure the basic information for this market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Market Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Memphis"
              className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-slate-300">
              Market State <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) =>
                updateFormData({
                  state: e.target.value.toUpperCase().slice(0, 2),
                })
              }
              placeholder="e.g., TN"
              maxLength={2}
              className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
            <p className="text-slate-500 text-xs">
              2-character state code (e.g., TN, AR, MS)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlSlug" className="text-slate-300">URL Slug</Label>
            <Input
              id="urlSlug"
              value={formData.urlSlug}
              onChange={(e) =>
                updateFormData({
                  urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="e.g., memphis"
              className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-slate-500 text-xs">
              URL-friendly identifier for this market
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site" className="text-slate-300">Site URL</Label>
            <Input
              id="site"
              type="url"
              value={formData.site || ""}
              onChange={(e) =>
                updateFormData({
                  site: e.target.value,
                })
              }
              placeholder="https://example.com"
              className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-slate-500 text-xs">
              Website URL for this market
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteTitle" className="text-slate-300">Site Title</Label>
            <Input
              id="siteTitle"
              value={formData.siteTitle || ""}
              onChange={(e) =>
                updateFormData({
                  siteTitle: e.target.value,
                })
              }
              placeholder="e.g., Memphis Market Site"
              className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-slate-500 text-xs">
              Title for the market website
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentMarket" className="text-slate-300">Parent Market</Label>
            <Select
              value={formData.parentMarket || "none"}
              onValueChange={(value) => {
                updateFormData({
                  parentMarket: value === "none" ? "" : value,
                })
                setSearchQuery("") // Reset search when selection changes
              }}
            >
              <SelectTrigger
                id="parentMarket"
                className="bg-black/50 border-slate-700 text-white focus:ring-emerald-500"
              >
                <SelectValue placeholder="Search and select a parent market">
                  {(() => {
                    // First try to use selectedParent state
                    if (selectedParent) {
                      return selectedParent.city || selectedParent.name || selectedParent.siteTitle || `Market #${selectedParent.id}`
                    }
                    // If not loaded yet, try to find it in parentMarkets list
                    if (formData.parentMarket && formData.parentMarket !== "none") {
                      const found = parentMarkets.find(m => String(m.id) === formData.parentMarket)
                      if (found) {
                        return found.city || found.name || found.siteTitle || `Market #${found.id}`
                      }
                    }
                    return "None (Top Level)"
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {/* Search input */}
                <div className="p-2 border-b border-slate-800">
                  <div className="relative">
                    <Input
                      placeholder="Search markets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-black/50 border-slate-700 text-white placeholder:text-slate-500 h-8 text-sm"
                      onKeyDown={(e) => {
                        // Prevent select from closing when typing
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        // Prevent select from closing when clicking input
                        e.stopPropagation()
                      }}
                    />
                    {loadingParents && (
                      <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* Options list */}
                <div className="max-h-[300px] overflow-y-auto">
                  <SelectItem
                    value="none"
                    className="focus:bg-slate-800 focus:text-white"
                  >
                    None (Top Level)
                  </SelectItem>
                  {parentMarkets.length === 0 && !loadingParents && debouncedSearch && (
                    <div className="px-2 py-6 text-center text-slate-400 text-sm">
                      No markets found matching "{debouncedSearch}"
                    </div>
                  )}
                  {parentMarkets.length === 0 && !loadingParents && !debouncedSearch && (
                    <div className="px-2 py-6 text-center text-slate-400 text-sm">
                      Start typing to search for markets
                    </div>
                  )}
                  {parentMarkets.map((market) => (
                    <SelectItem
                      key={market.id}
                      value={String(market.id)}
                      className="focus:bg-slate-800 focus:text-white"
                    >
                      {market.city || market.name || market.siteTitle || `Market #${market.id}`}
                      {market.state && (
                        <span className="ml-2 text-xs text-slate-500">({market.state})</span>
                      )}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            <p className="text-slate-500 text-xs">
              {loadingParents ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching markets...
                </span>
              ) : (
                "Type to search for a parent market, or select 'None' for top-level"
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Status</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={(e) =>
                    updateFormData({
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={(e) =>
                    updateFormData({
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

