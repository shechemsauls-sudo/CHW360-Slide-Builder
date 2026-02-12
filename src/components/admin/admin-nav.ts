import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users,
  Layers,
  Palette,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  items?: NavSubItem[];
}

export interface NavSubItem {
  title: string;
  href: string;
  badge?: string;
}

export const ADMIN_SIDEBAR_NAV: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Submissions",
    href: "/admin/submissions",
    icon: Inbox,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Slide Builder",
    href: "/admin/slides",
    icon: Layers,
    badge: "Soon",
  },
  {
    title: "Brand Assets",
    href: "/admin/assets",
    icon: Palette,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
