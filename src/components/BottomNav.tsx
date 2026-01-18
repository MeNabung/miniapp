"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { MessageCircle, PieChart } from "lucide-react";

// MVP: 2 tabs only - Chat and Portfolio
const tabs = [
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard", icon: PieChart, label: "Portfolio" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  // Hide nav on homepage (splash) or when not connected
  if (pathname === "/" || !isConnected) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[44px] rounded-lg transition-colors active:scale-95 ${
                isActive
                  ? "text-teal"
                  : "text-muted-foreground active:bg-cream-dark"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-teal" : ""}
              />
              <span
                className={`text-xs mt-1 ${
                  isActive ? "font-medium" : "font-normal"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
