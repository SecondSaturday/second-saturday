"use client";

import AuthMarketingPanel from "./AuthMarketingPanel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Form area - visible on all screen sizes */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Marketing panel - hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        <AuthMarketingPanel />
      </div>
    </div>
  );
}
