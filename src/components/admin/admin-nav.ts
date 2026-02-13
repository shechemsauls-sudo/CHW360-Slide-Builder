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
  adminOnly?: boolean;
  section?: string;
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
    adminOnly: true,
  },
  {
    title: "Submissions",
    href: "/admin/submissions",
    icon: Inbox,
    adminOnly: true,
    section: "Engagement",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
    section: "Management",
  },
  {
    title: "Brand Assets",
    href: "/admin/assets",
    icon: Palette,
    adminOnly: true,
  },
  {
    title: "Slide Builder",
    href: "/admin/slides",
    icon: Layers,
    badge: "Soon",
    section: "Tools",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    section: "Account",
  },
];
