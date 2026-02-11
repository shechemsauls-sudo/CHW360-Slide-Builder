"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { useAdminSidebar } from "./admin-sidebar-context";
import { ADMIN_SIDEBAR_NAV, type NavItem, type NavSubItem } from "./admin-nav";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

function NavLink({
  item,
  isCollapsed,
  isActive,
}: {
  item: NavSubItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[#C9725B]/10 text-[#C9725B]"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="truncate">{item.title}</span>
      {item.badge && (
        <span className="ml-auto rounded bg-[#2D5A5A]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8A8A]">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{item.title}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

function NavGroup({
  item,
  isCollapsed,
  pathname,
}: {
  item: NavItem;
  isCollapsed: boolean;
  pathname: string;
}) {
  const Icon = item.icon;
  const hasItems = item.items && item.items.length > 0;
  const isActive = item.href === pathname;
  const hasActiveChild = item.items?.some((sub) => pathname.startsWith(sub.href));
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  if (item.href && !hasItems) {
    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-[#C9725B]/10 text-[#C9725B]"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded bg-[#2D5A5A]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8A8A]">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>{item.title}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  }

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              hasActiveChild
                ? "bg-[#C9725B]/10 text-[#C9725B]"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="p-0">
          <div className="min-w-[160px] p-2">
            <p className="mb-2 px-2 text-xs font-semibold text-gray-400">{item.title}</p>
            {item.items?.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className={cn(
                  "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                  pathname.startsWith(sub.href)
                    ? "bg-[#C9725B]/10 text-[#C9725B]"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {sub.title}
              </Link>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            hasActiveChild
              ? "text-[#C9725B]"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 truncate text-left">{item.title}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8">
        <div className="space-y-1 pt-1">
          {item.items?.map((sub) => (
            <NavLink key={sub.href} item={sub} isCollapsed={false} isActive={pathname.startsWith(sub.href)} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn("flex items-center gap-3 border-b px-4 py-4", isCollapsed && "justify-center px-2")}
        style={{ borderColor: "rgba(45, 90, 90, 0.3)" }}
      >
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image src="/chw/logo.png" alt="CHW360" fill className="object-contain" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold text-white">CHW360</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {ADMIN_SIDEBAR_NAV.map((item) => (
          <NavGroup key={item.title} item={item} isCollapsed={isCollapsed} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useAdminSidebar();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden border-r md:block"
        style={{ width: SIDEBAR_WIDTH, borderColor: "rgba(45, 90, 90, 0.3)", backgroundColor: "#1a1a1a" }}
      />
    );
  }

  return (
    <TooltipProvider>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden border-r transition-all duration-200 ease-out md:block"
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          borderColor: "rgba(45, 90, 90, 0.3)",
          backgroundColor: "#1a1a1a",
        }}
      >
        <SidebarContent isCollapsed={isCollapsed} />
        <button
          onClick={toggle}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border text-gray-400 transition-colors hover:text-white"
          style={{ borderColor: "rgba(45, 90, 90, 0.4)", backgroundColor: "#1a1a1a" }}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
        <SheetContent
          side="left"
          className="w-[280px] border-r p-0"
          style={{ borderColor: "rgba(45, 90, 90, 0.3)", backgroundColor: "#1a1a1a" }}
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

export function AdminSidebarMobileToggle() {
  const { toggleMobile } = useAdminSidebar();
  return (
    <button
      onClick={toggleMobile}
      className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle menu</span>
    </button>
  );
}
