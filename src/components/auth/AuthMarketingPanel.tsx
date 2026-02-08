"use client";

import { CSSGradientLogo } from "@/components/branding";

export default function AuthMarketingPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8">
      <div className="w-48 h-48 mb-6">
        <CSSGradientLogo />
      </div>
      <p className="text-center text-lg text-purple-100/80 max-w-md">
        Plan your community events with ease
      </p>
    </div>
  );
}
