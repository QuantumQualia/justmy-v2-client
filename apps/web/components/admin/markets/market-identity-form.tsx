"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Mock parent markets
const MOCK_PARENT_MARKETS = [
    { id: 1, name: "Austin Metro" },
    { id: 2, name: "Dallas Fort Worth" },
    { id: 3, name: "Houston" },
    { id: 5, name: "San Antonio" },
];

interface MarketIdentityFormProps {
    initialData?: {
        name?: string;
        state?: string;
        slug?: string;
        parentMarketId?: number;
        isActive?: boolean;
    };
    onSubmit?: (data: any) => void;
}

export function MarketIdentityForm({
    initialData,
    onSubmit,
}: MarketIdentityFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [state, setState] = useState(initialData?.state || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [parentMarketId, setParentMarketId] = useState<string>(
        initialData?.parentMarketId?.toString() || ""
    );
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = {
            name,
            state,
            slug,
            parentMarketId: parentMarketId ? parseInt(parentMarketId) : null,
            isActive,
        };
        console.log("Form submitted:", formData);
        onSubmit?.(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Market Identity</CardTitle>
                <CardDescription>
                    Basic information and hierarchy for this market
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Market Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Austin Metro"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="state">
                                State Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="state"
                                value={state}
                                onChange={(e) => setState(e.target.value.toUpperCase())}
                                placeholder="TX"
                                maxLength={2}
                                required
                            />
                            <p className="text-xs text-muted-foreground">2-character code</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug</Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="austin-metro"
                            />
                            <p className="text-xs text-muted-foreground">
                                Used in market_site
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parent-market">Parent Market</Label>
                        <Select value={parentMarketId} onValueChange={setParentMarketId}>
                            <SelectTrigger id="parent-market">
                                <SelectValue placeholder="Select parent market (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {MOCK_PARENT_MARKETS.map((market) => (
                                    <SelectItem key={market.id} value={market.id.toString()}>
                                        {market.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="status">Market Status</Label>
                            <p className="text-sm text-muted-foreground">
                                {isActive
                                    ? "Market is currently active and visible"
                                    : "Market is hidden from public view"}
                            </p>
                        </div>
                        <Switch
                            id="status"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
