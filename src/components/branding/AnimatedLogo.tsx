"use client";

import { useState } from "react";
import CSSGradientLogo from "./CSSGradientLogo";
import WhatameshGradient from "./WhatameshGradient";
import Image from "next/image";

interface AnimatedLogoProps {
  className?: string;
}

export default function AnimatedLogo({ className = "" }: AnimatedLogoProps) {
  const [webglReady, setWebglReady] = useState(false);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ aspectRatio: "1/1" }}
    >
      {/* CSS Gradient (shows instantly, fades out when WebGL ready) */}
      <CSSGradientLogo
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: webglReady ? 0 : 1 }}
      />

      {/* WebGL Gradient (loads in background, fades in when ready) */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: webglReady ? 1 : 0 }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            maskImage: 'url(/logo-mask.svg)',
            maskSize: '85.9% 85.8%',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            WebkitMaskImage: 'url(/logo-mask.svg)',
            WebkitMaskSize: '85.9% 85.8%',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            imageRendering: '-webkit-optimize-contrast',
            WebkitFontSmoothing: 'antialiased',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <WhatameshGradient
            className="absolute inset-0"
            onReady={() => setWebglReady(true)}
          />
        </div>

        {/* Logo SVG with shadow/glow effects on top */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="2s6y Logo"
            width={760}
            height={760}
            className="w-full h-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
