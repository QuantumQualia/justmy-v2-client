"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ArrowRight, Layout, Briefcase, TrendingUp, Award, Check } from "lucide-react";
import { subscriptionService, SubscriptionPlan } from "@/lib/services/subscription";
import { ApiClientError } from "@/lib/services/auth";

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (plan: SubscriptionPlan) => {
    setLoading(true);
    try {
      const checkoutUrl = await subscriptionService.createCheckoutSession(plan);
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to start checkout. Please try again.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFreeSignup = (type: "personal" | "business" = "personal") => {
    // Preserve referral code from URL if present
    const referralCode = searchParams.get("ref") || searchParams.get("referral");
    const params = new URLSearchParams({ type });
    if (referralCode) {
      params.set("ref", referralCode);
    }
    router.push(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
      {/* --- NAVIGATION --- */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter">
            JustMy<span className="text-emerald-500">.com</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="cursor-pointer text-slate-400 hover:text-white hover:bg-white/10" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button 
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6"
              onClick={() => handleFreeSignup("personal")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-medium mb-8 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Founders Growth OS Available
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-white">
            Don't just live in the city. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Run it.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The first Personal Operating System for your life, business, and community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="cursor-pointer h-14 px-8 text-lg bg-white text-black hover:bg-slate-200 rounded-full font-bold transition-transform hover:scale-105" onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})}>
              Claim My Node <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* --- 4-TIER PRICING SECTION --- */}
      <section className="py-24 bg-slate-950 border-t border-slate-900" id="pricing">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your OS</h2>
            <p className="text-slate-400">Scale from personal identity to city leadership.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* 1. PERSONAL OS (Free) */}
            <PricingCard 
              icon={<Layout className="h-6 w-6 text-slate-400" />}
              title="Personal OS"
              price="Free"
              period="forever"
              desc="Manage your digital identity and personal data."
              btnText="Create Account"
              btnAction={() => handleFreeSignup("personal")}
              features={["Digital ID Card", "Personal Dashboard", "Read-only Map"]}
            />

            {/* 2. BUSINESS OS (Free) */}
            <PricingCard 
              icon={<Briefcase className="h-6 w-6 text-blue-400" />}
              title="Business OS"
              price="Free"
              period="forever"
              desc="Claim your node and manage basic listing info."
              btnText="Claim Business"
              btnAction={() => handleFreeSignup("business")}
              features={["Verified Business Node", "Basic Listing Info", "Receive Reviews"]}
            />

            {/* 3. GROWTH OS ($35/mo) */}
            <PricingCard 
              icon={<TrendingUp className="h-6 w-6 text-purple-400" />}
              title="Growth OS"
              price="$35"
              period="/mo"
              desc="Advanced tools, AI writing, and local promotion."
              btnText="Start Growth"
              btnAction={() => handleCheckout("GROWTH_MONTHLY")}
              features={["AI Content Writer", "Priority Map Rank", "5 Team Cards"]}
              isPopular={false}
              loading={loading}
            />

            {/* 4. FOUNDERS GROWTH OS ($350/yr) */}
            <div className="relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide z-10">
                Best Value
              </div>
              <Card className="bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-900/20 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded bg-emerald-500/10"><Award className="h-6 w-6 text-emerald-500" /></div>
                    <div className="text-lg font-medium text-emerald-400">Founders OS</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">$350<span className="text-sm font-normal text-slate-500">/yr</span></div>
                  <p className="text-emerald-200/60 text-xs mb-4">Save $70/year vs Monthly</p>
                  <p className="text-xs mb-6 text-slate-300">Full "City Partner" status. VIP Support.</p>
                  
                  <Button 
                    className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold mb-6"
                    onClick={() => handleCheckout("FOUNDER_YEARLY")}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Become a Founder"}
                  </Button>

                  <div className="mt-auto space-y-3">
                    {["Everything in Growth", "Verified Blue Check", "Early Access Features", "Founder Community Access"].map((item, i) => (
                      <div key={i} className="flex gap-2 items-center text-sm text-white">
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
      <footer className="border-t border-slate-900 bg-black py-20">
        <div className="container px-4 mx-auto max-w-5xl text-center">
          
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Ready to win with JustMy?</h2>
          
          <p className="text-slate-400 text-lg mb-12 max-w-3xl mx-auto leading-relaxed">
            Dive into our <span className="text-emerald-400 font-semibold">quick-start guides</span> for <span className="text-white font-semibold">Business</span>, <span className="text-white font-semibold">Enterprise</span>, and <span className="text-white font-semibold">Partner</span> users—see how easy it is to <span className="text-white font-semibold">grow faster</span>, <span className="text-white font-semibold">connect better</span>, and <span className="text-white font-semibold">dominate your market</span>!
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FooterLink href="#" text="Business Profile Guide" />
            <FooterLink href="#" text="Enterprise Suite Guide" />
            <FooterLink href="#" text="City Management Guide" />
            <FooterLink href="#" text="Business Investment Super Pack Guide" />
          </div>
          
          <div className="mt-16 text-xs text-slate-600">
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
    <Card className={`bg-slate-900/50 border-slate-800 text-slate-400 h-full ${isPopular ? 'border-blue-500/50' : ''}`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded bg-white/5 border border-white/10">{icon}</div>
          <div className={`text-lg font-medium ${isPopular ? 'text-blue-400' : 'text-white'}`}>{title}</div>
        </div>
        <div className="text-3xl font-bold text-white mb-1">{price}<span className="text-sm font-normal text-slate-500">{period}</span></div>
        <p className="text-xs mb-6 h-10">{desc}</p>
        
        <Button 
          variant={isPopular ? "default" : "outline"}
          className={`cursor-pointer w-full mb-6 ${isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold' : 'border-slate-700 hover:bg-slate-800 hover:text-white'}`}
          onClick={btnAction}
          disabled={loading}
        >
          {loading && isPopular ? "Loading..." : btnText}
        </Button>

        <div className="mt-auto space-y-3">
          {features.map((item: string, i: number) => (
            <div key={i} className="flex gap-2 items-center text-sm text-slate-300">
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
      className="block py-3 px-4 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-sm font-medium"
    >
      {text}
    </a>
  );
}

