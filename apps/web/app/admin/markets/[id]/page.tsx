"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketIdentityForm } from "@/components/admin/markets/market-identity-form";
import { MarketSocialsForm } from "@/components/admin/markets/market-socials-form";
import { MarketZipManager } from "@/components/admin/markets/market-zip-manager";
import { ArrowLeft, Save } from "lucide-react";

// Mock data for demonstration
const MOCK_MARKET = {
    id: 1,
    name: "Austin Metro",
    state: "TX",
    slug: "austin-metro",
    parentMarketId: undefined,
    isActive: true,
    facebookUrl: "https://facebook.com/austinmetro",
    instagramUrl: "https://instagram.com/austinmetro",
    twitterUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
    zipCodes: ["78701", "78702", "78703", "78704", "78705"],
};

export default function EditMarketPage() {
    const params = useParams();
    const router = useRouter();
    const marketId = params.id;

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate save
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Saving market:", marketId);
        setIsSaving(false);
    };

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin/markets")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Market
                        </h1>
                        <p className="text-muted-foreground">
                            Market ID: {marketId}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="socials">Socials</TabsTrigger>
                    <TabsTrigger value="territory">Territory</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <MarketIdentityForm
                        initialData={{
                            name: MOCK_MARKET.name,
                            state: MOCK_MARKET.state,
                            slug: MOCK_MARKET.slug,
                            parentMarketId: MOCK_MARKET.parentMarketId,
                            isActive: MOCK_MARKET.isActive,
                        }}
                    />
                </TabsContent>

                <TabsContent value="socials" className="space-y-4">
                    <MarketSocialsForm
                        initialData={{
                            facebookUrl: MOCK_MARKET.facebookUrl,
                            instagramUrl: MOCK_MARKET.instagramUrl,
                            twitterUrl: MOCK_MARKET.twitterUrl,
                            youtubeUrl: MOCK_MARKET.youtubeUrl,
                            linkedinUrl: MOCK_MARKET.linkedinUrl,
                        }}
                    />
                </TabsContent>

                <TabsContent value="territory" className="space-y-4">
                    <MarketZipManager initialZips={MOCK_MARKET.zipCodes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
