"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";

interface MarketSocialsFormProps {
    initialData?: {
        facebookUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        youtubeUrl?: string;
        linkedinUrl?: string;
    };
    onSubmit?: (data: any) => void;
}

export function MarketSocialsForm({
    initialData,
    onSubmit,
}: MarketSocialsFormProps) {
    const [facebookUrl, setFacebookUrl] = useState(
        initialData?.facebookUrl || ""
    );
    const [instagramUrl, setInstagramUrl] = useState(
        initialData?.instagramUrl || ""
    );
    const [twitterUrl, setTwitterUrl] = useState(initialData?.twitterUrl || "");
    const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl || "");
    const [linkedinUrl, setLinkedinUrl] = useState(
        initialData?.linkedinUrl || ""
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = {
            facebookUrl,
            instagramUrl,
            twitterUrl,
            youtubeUrl,
            linkedinUrl,
        };
        console.log("Social media data submitted:", formData);
        onSubmit?.(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>
                    Connect your market&apos;s social media profiles
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                        </Label>
                        <Input
                            id="facebook"
                            type="url"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                            placeholder="https://facebook.com/yourmarket"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            Instagram
                        </Label>
                        <Input
                            id="instagram"
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="https://instagram.com/yourmarket"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            Twitter / X
                        </Label>
                        <Input
                            id="twitter"
                            type="url"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            placeholder="https://twitter.com/yourmarket"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="youtube" className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-600" />
                            YouTube
                        </Label>
                        <Input
                            id="youtube"
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/@yourmarket"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                        </Label>
                        <Input
                            id="linkedin"
                            type="url"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="https://linkedin.com/company/yourmarket"
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
