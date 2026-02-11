"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { AdminSidebarMobileToggle } from "./admin-sidebar";
import { useAdminSidebar } from "./admin-sidebar-context";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./admin-sidebar";
import { ADMIN_SIDEBAR_NAV } from "./admin-nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

function useBreadcrumbs() {
  const pathname = usePathname();

  for (const item of ADMIN_SIDEBAR_NAV) {
    if (item.href === pathname) {
      return [{ label: item.title, href: item.href, isCurrent: true }];
    }
    if (item.items) {
      for (const subItem of item.items) {
        if (pathname.startsWith(subItem.href)) {
          const isExactMatch = pathname === subItem.href;
          return [
            { label: item.title, href: undefined, isCurrent: false },
            { label: subItem.title, href: subItem.href, isCurrent: isExactMatch },
          ];
        }
      }
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "admin") {
    return segments.slice(1).map((seg, idx, arr) => ({
      label: seg.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      href: idx < arr.length - 1 ? `/admin/${arr.slice(0, idx + 1).join("/")}` : undefined,
      isCurrent: idx === arr.length - 1,
    }));
  }

  return [];
}

export function AdminHeader() {
  const router = useRouter();
  const { isCollapsed } = useAdminSidebar();
  const breadcrumbs = useBreadcrumbs();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm transition-all duration-200 ease-out"
      style={{
        left: `${isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}px`,
        borderColor: "rgba(45, 90, 90, 0.3)",
        backgroundColor: "rgba(26, 26, 26, 0.95)",
      }}
    >
      <div className="flex items-center gap-4">
        <AdminSidebarMobileToggle />
        {breadcrumbs.length > 0 && (
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </BreadcrumbSeparator>
                  )}
                  <BreadcrumbItem>
                    {crumb.isCurrent ? (
                      <BreadcrumbPage className="text-white">{crumb.label}</BreadcrumbPage>
                    ) : crumb.href ? (
                      <BreadcrumbLink href={crumb.href} className="text-gray-400 hover:text-white">
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <span className="text-gray-500">{crumb.label}</span>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>

      <style jsx>{`
        @media (max-width: 767px) {
          header { left: 0 !important; }
        }
      `}</style>
    </header>
  );
}
