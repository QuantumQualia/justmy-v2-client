"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ArrowRight, Layout, Briefcase, TrendingUp, Award, Check } from "lucide-react";
import { DEFAULT_PROFILE_KIND, type ProfileKind } from "@/lib/os-types";

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToBizPricing = () => {
    router.push("/login?redirect=/biz-os/pricing");
  };

  const handleFreeSignup = (type: ProfileKind = DEFAULT_PROFILE_KIND) => {
    // Preserve referral code from URL if present
    const referralCode = searchParams.get("ref") || searchParams.get("referral");
    const params = new URLSearchParams({ type });
    if (referralCode) {
      params.set("ref", referralCode);
    }
    router.push(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground font-sans selection:bg-emerald-500 selection:text-black">
      {/* --- NAVIGATION --- */}

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-emerald-400 text-xs font-medium mb-8 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Founders Growth OS Available
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-foreground">
            Don't just live in the city. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Run it.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The first Personal Operating System for your life, business, and community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="cursor-pointer h-14 px-8 text-lg bg-foreground text-background hover:bg-foreground/90 rounded-full font-bold transition-transform hover:scale-105" onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})}>
              Claim My Node <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* --- PROFILE TYPES PRICING SECTION --- */}
      <section className="py-24 bg-background border-t border-border" id="pricing">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your OS</h2>
            <p className="text-muted-foreground">Scale from personal identity to city leadership.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* 1. PERSONAL OS (Free) */}
            <PricingCard 
              icon={<Layout className="h-6 w-6 text-muted-foreground" />}
              title="Personal OS"
              price="Free"
              period="forever"
              desc="Manage your digital identity and personal data."
              btnText="Create Account"
              btnAction={() => handleFreeSignup("personal")}
              features={["Digital ID Card", "Personal Dashboard", "Read-only Map"]}
            />

            {/* 2. BIZ OS (Free) */}
            <PricingCard 
              icon={<Briefcase className="h-6 w-6 text-blue-400" />}
              title="Biz OS"
              price="Free"
              period="forever"
              desc="Claim your node and manage basic listing info."
              btnText="Claim Business"
              btnAction={() => handleFreeSignup("biz")}
              features={["Verified Business Node", "Basic Listing Info", "Receive Reviews"]}
            />

            {/* 3. GROWTH OS ($35/mo) */}
            <PricingCard 
              icon={<TrendingUp className="h-6 w-6 text-purple-400" />}
              title="Command OS"
              price="Paid"
              period=""
              desc="Same Biz OS tools. Subscribe after you claim."
              btnText="See plans"
              btnAction={goToBizPricing}
              features={["Everything in Biz OS", "Command OS tag", "Stripe checkout in-app"]}
              isPopular={false}
            />

            {/* 4. FOUNDERS GROWTH OS ($350/yr) */}
            <div className="relative transform md:-translate-y-4" id="pricing_founder">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide z-10">
                Best Value
              </div>
              <Card className="bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded bg-emerald-500/10"><Award className="h-6 w-6 text-emerald-500" /></div>
                    <div className="text-lg font-medium text-emerald-400">Command PRO / Enterprise</div>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">Paid</div>
                  <p className="text-emerald-500/80 text-xs mb-4">Prices live in Stripe</p>
                  <p className="text-xs mb-6 text-muted-foreground">Claim Biz OS first, then subscribe in-app.</p>
                  
                  <Button 
                    className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold mb-6"
                    onClick={goToBizPricing}
                  >
                    See plans
                  </Button>

                  <div className="mt-auto space-y-3">
                    {["Everything in Biz OS", "Command PRO or Enterprise tag", "Annual or monthly Stripe"].map((item, i) => (
                      <div key={i} className="flex gap-2 items-center text-sm text-foreground">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* --- NEW "SUCCESS" FOOTER --- */}
      <footer className="border-t border-border bg-background py-20">
        <div className="container px-4 mx-auto max-w-5xl text-center">
          
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">Ready to win with JustMy?</h2>
          
          <p className="text-muted-foreground text-lg mb-12 max-w-3xl mx-auto leading-relaxed">
            Dive into our <span className="text-emerald-400 font-semibold">quick-start guides</span> for <span className="text-foreground font-semibold">Business</span>, <span className="text-foreground font-semibold">Enterprise</span>, and <span className="text-foreground font-semibold">Partner</span> users—see how easy it is to <span className="text-foreground font-semibold">grow faster</span>, <span className="text-foreground font-semibold">connect better</span>, and <span className="text-foreground font-semibold">dominate your market</span>!
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FooterLink href="#" text="Business Profile Guide" />
            <FooterLink href="#" text="Enterprise Suite Guide" />
            <FooterLink href="#" text="City Management Guide" />
            <FooterLink href="#" text="Business Investment Super Pack Guide" />
          </div>
          
          <div className="mt-16 text-xs text-muted-foreground">
            © 2026 JustMy Operating System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function PricingCard({ icon, title, price, period, desc, btnText, btnAction, features, isPopular, loading }: any) {
  return (
    <Card className={`h-full ${isPopular ? 'border-blue-500/50' : ''}`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded bg-muted border border-border">{icon}</div>
          <div className={`text-lg font-medium ${isPopular ? 'text-blue-400' : 'text-foreground'}`}>{title}</div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">{price}<span className="text-sm font-normal text-muted-foreground">{period}</span></div>
        <p className="text-xs mb-6 h-10 text-muted-foreground">{desc}</p>
        
        <Button 
          variant={isPopular ? "default" : "outline"}
          className={`cursor-pointer w-full mb-6 ${isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold' : 'border-border hover:bg-accent hover:text-accent-foreground'}`}
          onClick={btnAction}
          disabled={loading}
        >
          {loading && isPopular ? "Loading..." : btnText}
        </Button>

        <div className="mt-auto space-y-3">
          {features.map((item: string, i: number) => (
            <div key={i} className="flex gap-2 items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FooterLink({ href, text }: { href: string, text: string }) {
  return (
    <a 
      href={href} 
      className="block py-3 px-4 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-emerald-500/50 hover:bg-accent transition-all text-sm font-medium"
    >
      {text}
    </a>
  );
}
