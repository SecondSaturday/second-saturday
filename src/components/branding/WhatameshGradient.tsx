"use client";

import { useEffect, useRef, useState, useId } from "react";

interface WhatameshGradientProps {
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
}

// Type definition for whatamesh Gradient instance
interface GradientInstance {
  initGradient: (selector: string) => void;
  pause: () => void;
}

export default function WhatameshGradient({
  className = "",
  style = {},
  onReady
}: WhatameshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Generate unique ID for each instance
  const canvasId = useId().replace(/:/g, '-');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas ref not found");
      return;
    }

    let gradientInstance: GradientInstance | null = null;

    // Dynamically import Gradient to avoid SSR issues
    import("whatamesh")
      .then(({ Gradient }) => {
        try {
          gradientInstance = new Gradient();
          gradientInstance.initGradient(`#whatamesh-canvas-${canvasId}`);
          setIsLoaded(true);
          console.log(`Whatamesh gradient initialized successfully (${canvasId})`);

          // Notify parent that gradient is ready
          if (onReady) {
            onReady();
          }
        } catch (err) {
          console.error("Failed to initialize whatamesh gradient:", err);
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .catch((error) => {
        console.error("Failed to load whatamesh module:", error);
        setError(error instanceof Error ? error.message : String(error));
      });

    // Cleanup function
    return () => {
      if (gradientInstance && typeof gradientInstance.pause === 'function') {
        gradientInstance.pause();
      }
    };
  }, [canvasId, onReady]);

  return (
    <>
      <canvas
        id={`whatamesh-canvas-${canvasId}`}
        ref={canvasRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          ...style
        }}
        data-loaded={isLoaded}
        data-error={error || undefined}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-error/10 text-error text-xs p-2">
          Gradient error: {error}
        </div>
      )}
    </>
  );
}
