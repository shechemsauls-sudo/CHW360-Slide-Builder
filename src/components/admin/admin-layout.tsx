"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Rocket } from "lucide-react";
import { AdminSidebarProvider, useAdminSidebar } from "./admin-sidebar-context";
import { AdminSidebar, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

const DEPLOY_BANNER_HEIGHT = 28;

function DeployBanner({ sidebarOffset }: { sidebarOffset: number }) {
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
    <>
      <div
        className="fixed top-0 right-0 z-30 flex items-center justify-center gap-1.5 text-xs transition-all duration-200 ease-out"
        style={{
          left: sidebarOffset,
          height: DEPLOY_BANNER_HEIGHT,
          backgroundColor: "rgba(45, 90, 90, 0.45)",
          color: "rgba(255,255,255,0.65)",
        }}
      >
        <Rocket className="h-3 w-3" />
        <span>Last deploy: {formatted}</span>
      </div>
      <style jsx>{`
        @media (max-width: 767px) {
          div { left: 0 !important; }
        }
      `}</style>
    </>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useAdminSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const sidebarOffset = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#111111" }}>
      <AdminSidebar />
      <DeployBanner sidebarOffset={sidebarOffset} />
      <AdminHeader topOffset={DEPLOY_BANNER_HEIGHT} />

      <main
        className="transition-all duration-200 ease-out"
        style={{
          marginLeft: sidebarOffset,
          paddingTop: 14 * 4 + DEPLOY_BANNER_HEIGHT,
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

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </AdminSidebarProvider>
  );
}
