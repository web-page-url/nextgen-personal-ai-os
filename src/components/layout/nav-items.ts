import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FileText, FolderKanban, Search, MessageSquare, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Collections", href: "/collections", icon: FolderKanban },
  { label: "Search", href: "/search", icon: Search },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];
