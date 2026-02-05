"use client";

import React from "react";

interface PhoneCaseWrapperProps {
  children: React.ReactNode;
}

export default function PhoneCaseWrapper({ children }: PhoneCaseWrapperProps) {
  // Phone dimensions: iPhone 14 Pro size (375px width, 812px height)
  // Adding padding for phone frame, total screen area is ~375x812
  const phoneWidth = 375;
  const phoneHeight = 812;
  const framePadding = 12; // Phone frame padding
  
  return (
    <div className="relative flex items-center justify-center p-8 md:p-12">
      {/* Phone Case SVG/Image */}
      <div className="relative">
        {/* Phone Frame - Using CSS to create a phone-like appearance */}
        <div 
          className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-[3rem] p-3 shadow-2xl"
          style={{ width: `${phoneWidth + framePadding * 2}px` }}
        >
          {/* Screen Bezel */}
          <div className="relative bg-black rounded-[2.5rem] overflow-hidden" style={{ height: `${phoneHeight}px` }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
            
            {/* Screen Content - Fixed height with scroll */}
            <div 
              className="relative bg-slate-900 rounded-[2.5rem] overflow-y-auto h-full custom-scrollbar"
              style={{ 
                height: `${phoneHeight}px`,
                width: `${phoneWidth}px`
              }}
            >
              {children}
            </div>
          </div>
          
          {/* Home Indicator (for modern phones) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl -z-10" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  );
}
