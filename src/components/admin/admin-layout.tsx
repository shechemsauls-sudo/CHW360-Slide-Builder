"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Rocket } from "lucide-react";
import { AdminSidebarProvider, useAdminSidebar } from "./admin-sidebar-context";
import { AdminSidebar, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

const DEPLOY_BANNER_HEIGHT = 28;

function DeployBanner() {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
  if (!buildTime) return null;

  const date = new Date(buildTime);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-1.5 text-xs"
      style={{
        height: DEPLOY_BANNER_HEIGHT,
        backgroundColor: "rgba(45, 90, 90, 0.45)",
        color: "rgba(255,255,255,0.65)",
      }}
    >
      <Rocket className="h-3 w-3" />
      <span>Last deploy: {formatted}</span>
    </div>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useAdminSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const sidebarOffset = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;
  const hasBanner = !!process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
  const bannerHeight = hasBanner ? DEPLOY_BANNER_HEIGHT : 0;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#111111" }}>
      <DeployBanner />
      <AdminSidebar topOffset={bannerHeight} />
      <AdminHeader topOffset={bannerHeight} />

      <main
        className="transition-all duration-200 ease-out"
        style={{
          marginLeft: sidebarOffset,
          paddingTop: 14 * 4 + bannerHeight,
          minHeight: "100vh",
        }}
      >
        <div className="p-6">{children}</div>
      </main>

      <style jsx>{`
        @media (max-width: 767px) {
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export function AdminDashboardLayout({ children, userRole }: { children: ReactNode; userRole: string }) {
  return (
    <AdminSidebarProvider userRole={userRole}>
      <DashboardContent>{children}</DashboardContent>
    </AdminSidebarProvider>
  );
}
