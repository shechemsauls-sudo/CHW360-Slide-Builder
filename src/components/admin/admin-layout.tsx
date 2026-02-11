"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebarProvider, useAdminSidebar } from "./admin-sidebar-context";
import { AdminSidebar, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useAdminSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#111111" }}>
      <AdminSidebar />
      <AdminHeader />

      <main
        className="min-h-screen pt-14 transition-all duration-200 ease-out"
        style={{ marginLeft: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
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
