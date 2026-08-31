"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FolderKanban, LayoutDashboard, LifeBuoy, Users } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard Dapur", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Kelola Menu", href: "/admin/menus", icon: BookOpen },
    { name: "Kategori", href: "/admin/categories", icon: FolderKanban },
    { name: "Pelanggan", href: "/admin/customers", icon: Users },
    { name: "Pusat Bantuan", href: "/admin/support", icon: LifeBuoy },
  ];

  return (
    <aside className="w-full border-b border-emerald-100 bg-white/90 p-4 backdrop-blur-md md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="mb-5 flex items-center gap-2 px-2 font-black text-stone-900 md:mb-8 md:text-lg">
        <span className="size-2.5 rounded-full bg-orange-500 shadow-[0_0_0_5px_rgba(249,115,22,0.12)]" aria-hidden="true" />
        Admin Panel KOOMS
      </div>

      <nav className="grid grid-cols-2 gap-1 md:block md:space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <item.icon className="size-4" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}