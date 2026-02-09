"use client";

import Image from "next/image";

interface CSSGradientLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function CSSGradientLogo({
  className = "",
  style = {}
}: CSSGradientLogoProps) {
  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        aspectRatio: "1/1",
        ...style
      }}
    >
      {/* Animated CSS mesh gradient masked to logo shape */}
      <div
        className="absolute inset-0 flex items-center justify-center css-mesh-gradient"
        style={{
          maskImage: 'url(/logo-mask.svg)',
          maskSize: '85.9% 85.8%',
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          WebkitMaskImage: 'url(/logo-mask.svg)',
          WebkitMaskSize: '85.9% 85.8%',
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
        }}
      />

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
  );
}
