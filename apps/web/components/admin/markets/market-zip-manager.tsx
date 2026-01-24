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
    <Card className="bg-slate-900/50 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-white">Territory Management</CardTitle>
        <CardDescription className="text-slate-400">
          Manage zip codes for this market territory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="zipInput" className="text-slate-300">Add Zip Codes</Label>
          <textarea
            id="zipInput"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter zip codes separated by commas (e.g., 38103, 38104, 38105)"
            className="flex min-h-[100px] w-full rounded-md border border-slate-700 bg-black/50 px-3 py-2 text-sm text-white shadow-xs placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-xs">
              Press Ctrl+Enter (or Cmd+Enter) to add zip codes
            </p>
            <Button onClick={handleAddZips} size="sm" disabled={!zipInput.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Zip Codes
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Current Zip Codes ({zips.length})</Label>
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
            <p className="text-slate-500 text-sm py-4 text-center border border-slate-800 rounded-md bg-black/30">
              No zip codes added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 border border-slate-800 rounded-md bg-black/30">
              {zips.map((zip) => (
                <Badge
                  key={zip}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1 bg-slate-800 text-slate-300"
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

