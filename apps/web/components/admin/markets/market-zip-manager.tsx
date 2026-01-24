"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { X, Plus } from "lucide-react";

interface MarketZipManagerProps {
    initialZips?: string[];
    onUpdate?: (zips: string[]) => void;
}

export function MarketZipManager({
    initialZips = [],
    onUpdate,
}: MarketZipManagerProps) {
    // Mock initial data
    const [zipCodes, setZipCodes] = useState<string[]>(
        initialZips.length > 0
            ? initialZips
            : ["78701", "78702", "78703", "78704", "78705", "78731", "78746"]
    );
    const [newZipsInput, setNewZipsInput] = useState("");

    const handleAddZips = () => {
        if (!newZipsInput.trim()) return;

        // Parse input - split by comma, newline, or space
        const newZips = newZipsInput
            .split(/[\s,]+/)
            .map((zip) => zip.trim())
            .filter((zip) => zip.length > 0);

        // Combine with existing and remove duplicates
        const combined = [...zipCodes, ...newZips];
        const unique = Array.from(new Set(combined));

        setZipCodes(unique);
        setNewZipsInput("");
        onUpdate?.(unique);
    };

    const handleRemoveZip = (zipToRemove: string) => {
        const updated = zipCodes.filter((zip) => zip !== zipToRemove);
        setZipCodes(updated);
        onUpdate?.(updated);
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to remove all zip codes?")) {
            setZipCodes([]);
            onUpdate?.([]);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Zip Codes</CardTitle>
                    <CardDescription>
                        Paste zip codes separated by commas, spaces, or new lines
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="zip-input">Zip Codes</Label>
                        <Textarea
                            id="zip-input"
                            value={newZipsInput}
                            onChange={(e) => setNewZipsInput(e.target.value)}
                            placeholder="78701, 78702, 78703&#10;or&#10;78704&#10;78705"
                            rows={5}
                        />
                    </div>
                    <Button onClick={handleAddZips} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Zip Codes
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Zip Codes</CardTitle>
                            <CardDescription>
                                {zipCodes.length} zip code{zipCodes.length !== 1 ? "s" : ""}{" "}
                                assigned to this market
                            </CardDescription>
                        </div>
                        {zipCodes.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAll}
                                className="text-destructive"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {zipCodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">
                                No zip codes assigned yet
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Add zip codes above to define this market&apos;s territory
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {zipCodes.map((zip) => (
                                <Badge
                                    key={zip}
                                    variant="secondary"
                                    className="text-sm px-3 py-1"
                                >
                                    {zip}
                                    <button
                                        onClick={() => handleRemoveZip(zip)}
                                        className="ml-2 hover:text-destructive"
                                        aria-label={`Remove ${zip}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
