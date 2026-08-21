"use client"

import { useState, useEffect } from "react"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

type MarketSocialsFormData = {
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  youtubeUrl: string
  linkedinUrl: string
}

type MarketSocialsFormProps = {
  initialData?: Partial<MarketSocialsFormData>
  onChange?: (data: MarketSocialsFormData) => void
}

export function MarketSocialsForm({ initialData, onChange }: MarketSocialsFormProps) {
  const [formData, setFormData] = useState<MarketSocialsFormData>({
    facebookUrl: initialData?.facebookUrl || "",
    instagramUrl: initialData?.instagramUrl || "",
    twitterUrl: initialData?.twitterUrl || "",
    youtubeUrl: initialData?.youtubeUrl || "",
    linkedinUrl: initialData?.linkedinUrl || "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        facebookUrl: initialData.facebookUrl ?? prev.facebookUrl,
        instagramUrl: initialData.instagramUrl ?? prev.instagramUrl,
        twitterUrl: initialData.twitterUrl ?? prev.twitterUrl,
        youtubeUrl: initialData.youtubeUrl ?? prev.youtubeUrl,
        linkedinUrl: initialData.linkedinUrl ?? prev.linkedinUrl,
      }))
    }
  }, [initialData])

  const handleChange = (field: keyof MarketSocialsFormData, value: string) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onChange?.(updated)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Social Media</CardTitle>
        <CardDescription className="text-muted-foreground">
          Add social media links for this market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl" className="text-muted-foreground">Facebook URL</Label>
            <Input
              id="facebookUrl"
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleChange("facebookUrl", e.target.value)}
              placeholder="https://facebook.com/..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl" className="text-muted-foreground">Instagram URL</Label>
            <Input
              id="instagramUrl"
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => handleChange("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterUrl" className="text-muted-foreground">X (Twitter) URL</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => handleChange("twitterUrl", e.target.value)}
              placeholder="https://x.com/..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeUrl" className="text-muted-foreground">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => handleChange("youtubeUrl", e.target.value)}
              placeholder="https://youtube.com/..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl" className="text-muted-foreground">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleChange("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

