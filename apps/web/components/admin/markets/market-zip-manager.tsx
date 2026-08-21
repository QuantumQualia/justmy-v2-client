"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { X } from "lucide-react"

type MarketZipManagerProps = {
  initialZips?: string[]
  onChange?: (zips: string[]) => void
}

export function MarketZipManager({ initialZips = [], onChange }: MarketZipManagerProps) {
  const [zipInput, setZipInput] = useState("")
  const [zips, setZips] = useState<string[]>(initialZips)
  const isInitialMount = useRef(true)
  const isSyncingFromParent = useRef(false)
  const prevInitialZipsRef = useRef<string[]>(initialZips)

  // Update zips when initialZips changes from parent (only if initialZips actually changed)
  useEffect(() => {
    const prevInitialZipsStr = [...prevInitialZipsRef.current].sort().join(",")
    const currentInitialZipsStr = [...initialZips].sort().join(",")
    
    // Only sync if initialZips actually changed (not just if it's different from current zips)
    if (prevInitialZipsStr !== currentInitialZipsStr) {
      isSyncingFromParent.current = true
      setZips([...initialZips])
      prevInitialZipsRef.current = [...initialZips]
      // Reset flag after state update
      setTimeout(() => {
        isSyncingFromParent.current = false
      }, 0)
    }
    
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [initialZips])

  // Call onChange when zips changes (but not on initial mount or when syncing from parent)
  useEffect(() => {
    if (!isInitialMount.current && !isSyncingFromParent.current && onChange) {
      // Use a small delay to ensure state has updated
      const timeoutId = setTimeout(() => {
        onChange(zips)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [zips, onChange])

  const handleAddZips = () => {
    if (!zipInput.trim()) return

    // Parse comma-separated zip codes
    const newZips = zipInput
      .split(",")
      .map((zip) => zip.trim())
      .filter((zip) => zip.length > 0)

    // Filter out duplicates
    const uniqueNewZips = newZips.filter((zip) => !zips.includes(zip))

    if (uniqueNewZips.length > 0) {
      const updatedZips = [...zips, ...uniqueNewZips].sort()
      // Ensure we're not syncing from parent when user adds zips
      isSyncingFromParent.current = false
      setZips(updatedZips)
      setZipInput("")
    }
  }

  const handleRemoveZip = (zipToRemove: string) => {
    const updatedZips = zips.filter((zip) => zip !== zipToRemove)
    setZips(updatedZips)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddZips()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Territory Management</CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage zip codes for this market territory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="zipInput" className="text-muted-foreground">Add Zip Codes</Label>
          <textarea
            id="zipInput"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter zip codes separated by commas (e.g., 38103, 38104, 38105)"
            className="flex min-h-[100px] w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Press Ctrl+Enter (or Cmd+Enter) to add zip codes
            </p>
            <Button onClick={handleAddZips} size="sm" disabled={!zipInput.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Zip Codes
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Current Zip Codes ({zips.length})</Label>
            {zips.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZips([])
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear All
              </Button>
            )}
          </div>
          {zips.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center border border-border rounded-md bg-muted">
              No zip codes added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-muted">
              {zips.map((zip) => (
                <Badge
                  key={zip}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1 bg-muted text-muted-foreground"
                >
                  {zip}
                  <button
                    onClick={() => handleRemoveZip(zip)}
                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                    aria-label={`Remove ${zip}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

