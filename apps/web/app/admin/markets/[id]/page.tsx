"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { MarketIdentityForm } from "@/components/admin/markets/market-identity-form"
import { MarketSocialsForm } from "@/components/admin/markets/market-socials-form"
import { MarketZipManager } from "@/components/admin/markets/market-zip-manager"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { marketsService, ApiClientError } from "@/lib/services/markets"

type TabId = "general" | "socials" | "territory"

export default function EditMarketPage() {
  const router = useRouter()
  const params = useParams()
  const marketId = params.id as string

  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [identityData, setIdentityData] = useState<any>(null)
  const [socialsData, setSocialsData] = useState<any>(null)
  const [zipData, setZipData] = useState<string[]>([])
  const [originalZipData, setOriginalZipData] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedMarketIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fetchingRef = useRef<string | null>(null)
  const hasDataRef = useRef(false)
  const currentMarketIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!marketId) return

    // Skip if we've already successfully fetched this marketId and have data
    if (fetchedMarketIdRef.current === marketId && hasDataRef.current) {
      setLoading(false)
      return
    }

    // Skip if we're already fetching this marketId
    if (fetchingRef.current === marketId) {
      return
    }

    // Track the current marketId for this effect
    const effectMarketId = marketId
    currentMarketIdRef.current = marketId
    fetchingRef.current = marketId

    // Cancel any previous request for a different marketId
    if (abortControllerRef.current && currentMarketIdRef.current !== marketId) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchMarket = async () => {
      // Double-check we're still fetching the same marketId
      if (fetchingRef.current !== effectMarketId || currentMarketIdRef.current !== effectMarketId) {
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const market = await marketsService.getMarketById(effectMarketId, {
          includeSocials: true,
          includeZipcodes: true,
        })

        // Check if marketId changed or request was aborted
        if (currentMarketIdRef.current !== effectMarketId || abortController.signal.aborted) {
          return
        }

        // Mark as fetched only after successful response
        fetchedMarketIdRef.current = effectMarketId
        hasDataRef.current = true

        // Map API response to form data format
        setIdentityData({
          name: market.name,
          state: market.state || "",
          urlSlug: market.slug,
          parentMarket: market.parentId ? String(market.parentId) : "none",
          status: market.status === "ACTIVE" ? "Active" : "Inactive",
          site: market.site || "",
          siteTitle: market.siteTitle || "",
        })

        // Map socials data
        if (market.socials) {
          setSocialsData({
            facebookUrl: market.socials.facebook || "",
            instagramUrl: market.socials.instagram || "",
            twitterUrl: market.socials.twitter || "",
            youtubeUrl: market.socials.youtube || "",
            linkedinUrl: market.socials.linkedin || "",
          })
        } else {
          setSocialsData({
            facebookUrl: "",
            instagramUrl: "",
            twitterUrl: "",
            youtubeUrl: "",
            linkedinUrl: "",
          })
        }

        // Map zipcodes
        if (market.zipcodes && market.zipcodes.length > 0) {
          const zipcodes = market.zipcodes.map((zip) => zip.zipcode)
          setZipData(zipcodes)
          setOriginalZipData(zipcodes)
        } else {
          setZipData([])
          setOriginalZipData([])
        }
      } catch (err) {
        // Don't set error if marketId changed or request was aborted
        if (currentMarketIdRef.current !== effectMarketId || abortController.signal.aborted) {
          return
        }
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load market. Please try again."
        setError(errorMessage)
      } finally {
        // Only update loading if we're still on the same marketId
        if (currentMarketIdRef.current === effectMarketId && !abortController.signal.aborted) {
          setLoading(false)
          if (fetchingRef.current === effectMarketId) {
            fetchingRef.current = null
          }
        }
      }
    }

    fetchMarket()

    return () => {
      // Only abort if marketId actually changed
      if (currentMarketIdRef.current !== effectMarketId) {
        abortController.abort()
        if (fetchingRef.current === effectMarketId) {
          fetchingRef.current = null
        }
      }
    }
  }, [marketId])

  const handleSave = async () => {
    if (!identityData) return

    setSaving(true)
    setError(null)
    try {
      // Map form data back to API format
      const updateData: any = {
        name: identityData.name,
        slug: identityData.urlSlug,
        state: identityData.state,
        status: identityData.status === "Active" ? "ACTIVE" : "INACTIVE",
      }

      // Add optional fields
      if (identityData.site) {
        updateData.site = identityData.site
      }
      if (identityData.siteTitle) {
        updateData.siteTitle = identityData.siteTitle
      }

      // Handle parent market
      if (identityData.parentMarket && identityData.parentMarket !== "none") {
        updateData.parentId = parseInt(identityData.parentMarket, 10)
      } else {
        updateData.parentId = undefined
      }

      // Add socials if provided
      if (socialsData) {
        const socialsPayload: any = {}
        if (socialsData.facebookUrl) socialsPayload.facebook = socialsData.facebookUrl
        if (socialsData.instagramUrl) socialsPayload.instagram = socialsData.instagramUrl
        if (socialsData.twitterUrl) socialsPayload.twitter = socialsData.twitterUrl
        if (socialsData.youtubeUrl) socialsPayload.youtube = socialsData.youtubeUrl
        if (socialsData.linkedinUrl) socialsPayload.linkedin = socialsData.linkedinUrl

        updateData.socials = socialsPayload
      }

      // Add zipcodes - send all current zipcodes
      if (zipData && zipData.length > 0) {
        updateData.zipcodes = zipData
      } else {
        // If no zipcodes, send empty array to clear them
        updateData.zipcodes = []
      }

      // Update market with all data in one call
      await marketsService.updateMarket(marketId, updateData)

      router.push("/admin/markets")
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update market. Please try again."
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "General" },
    { id: "socials", label: "Socials" },
    { id: "territory", label: "Territory" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Market</h1>
            <p className="text-slate-400">Market ID: {marketId}</p>
          </div>
          <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading market data...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Market</h1>
          <p className="text-slate-400">Market ID: {marketId}</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/admin/markets">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !identityData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            <div className="border-b border-slate-800">
              <nav className="flex gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? "border-emerald-500 text-emerald-500 font-medium"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              {activeTab === "general" && (
                <MarketIdentityForm
                  initialData={identityData}
                  onChange={(data) => setIdentityData(data)}
                  currentMarketId={marketId}
                />
              )}
              {activeTab === "socials" && (
                <MarketSocialsForm
                  initialData={socialsData}
                  onChange={(data) => setSocialsData(data)}
                />
              )}
              {activeTab === "territory" && (
                <MarketZipManager
                  initialZips={zipData}
                  onChange={(zips) => setZipData(zips)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

