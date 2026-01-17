"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFarcaster } from "./providers";

export default function Home() {
  const router = useRouter();
  const { isReady } = useFarcaster();

  // Redirect to chat page once SDK is ready
  useEffect(() => {
    if (isReady) {
      router.replace("/chat");
    }
  }, [isReady, router]);

  // Show loading while SDK initializes
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-teal mb-2">MeNabung</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
