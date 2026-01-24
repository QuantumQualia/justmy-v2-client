"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { MarketIdentityForm } from "@/components/admin/markets/market-identity-form"
import { MarketSocialsForm } from "@/components/admin/markets/market-socials-form"
import { MarketZipManager } from "@/components/admin/markets/market-zip-manager"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { marketsService, ApiClientError } from "@/lib/services/markets"

type TabId = "general" | "socials" | "territory"

export default function CreateMarketPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [identityData, setIdentityData] = useState<any>(null)
  const [socialsData, setSocialsData] = useState<any>(null)
  const [zipData, setZipData] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!identityData) {
      setError("Please fill in the required fields")
      return
    }

    setSaving(true)
    setError(null)
    try {
      // Map form data to API format
      const createData: any = {
        name: identityData.name,
        slug: identityData.urlSlug || identityData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        state: identityData.state,
        status: identityData.status === "Active" ? "ACTIVE" : "INACTIVE",
      }

      // Add optional fields
      if (identityData.site) {
        createData.site = identityData.site
      }
      if (identityData.siteTitle) {
        createData.siteTitle = identityData.siteTitle
      }

      // Handle parent market
      if (identityData.parentMarket && identityData.parentMarket !== "none") {
        createData.parentId = parseInt(identityData.parentMarket, 10)
      }

      // Add socials if provided
      if (socialsData) {
        const socialsPayload: any = {}
        if (socialsData.facebookUrl) socialsPayload.facebook = socialsData.facebookUrl
        if (socialsData.instagramUrl) socialsPayload.instagram = socialsData.instagramUrl
        if (socialsData.twitterUrl) socialsPayload.twitter = socialsData.twitterUrl
        if (socialsData.youtubeUrl) socialsPayload.youtube = socialsData.youtubeUrl
        if (socialsData.linkedinUrl) socialsPayload.linkedin = socialsData.linkedinUrl

        if (Object.keys(socialsPayload).length > 0) {
          createData.socials = socialsPayload
        }
      }

      // Add zipcodes if provided
      if (zipData && zipData.length > 0) {
        createData.zipcodes = zipData
      }

      // Create the market with all data
      await marketsService.createMarket(createData)

      router.push("/admin/markets")
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to create market. Please try again."
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

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Create Market</h1>
          <p className="text-slate-400">Add a new market to the system</p>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <div className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
                {error}
              </div>
            )}

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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Market
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
                  onChange={(data) => setIdentityData(data)}
                />
              )}
              {activeTab === "socials" && (
                <MarketSocialsForm
                  onChange={(data) => setSocialsData(data)}
                />
              )}
              {activeTab === "territory" && (
                <MarketZipManager
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


