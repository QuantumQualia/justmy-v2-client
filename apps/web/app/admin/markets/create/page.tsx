"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { AdminNotice, AdminPage, AdminPanel } from "@/components/admin/admin-page"
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
    <AdminPage
      title="Create market"
      description="Add a market, then assign sponsor profiles from the market’s Sponsors tab."
      width="5xl"
      actions={
        <Button onClick={handleSave} disabled={saving || !identityData}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Creating..." : "Create market"}
        </Button>
      }
    >
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      <AdminPanel>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/markets">
                <ArrowLeft className="h-4 w-4" />
                Markets
              </Link>
            </Button>
            <div className="inline-flex flex-wrap rounded-full bg-muted p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === "general" && (
              <MarketIdentityForm onChange={(data) => setIdentityData(data)} />
            )}
            {activeTab === "socials" && (
              <MarketSocialsForm onChange={(data) => setSocialsData(data)} />
            )}
            {activeTab === "territory" && (
              <MarketZipManager onChange={(zips) => setZipData(zips)} />
            )}
          </div>
        </div>
      </AdminPanel>
    </AdminPage>
  )
}


