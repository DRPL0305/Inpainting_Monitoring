'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  FileText,
  Sparkles
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const allNavItems: (SidebarItem & { adminOnly?: boolean })[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Logo Tab', href: '/logos', icon: ImageIcon },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Activity Logs', href: '/logs', icon: FileText, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || userRole === 'ADMIN');

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-30 flex w-20 flex-col items-center border-r border-card-border bg-card py-6">
      {/* Brand Logo Card */}
      <Link
        href="/dashboard"
        className="mb-8 flex h-16 w-14 flex-col items-center justify-center rounded-xl bg-white shadow-md active:scale-95 transition-transform cursor-pointer p-1 hover:shadow-lg hover:scale-105"
        title="Inpainting Monitoring"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="mt-1 text-[9px] font-black tracking-wider text-black uppercase select-none">
          INPAINT
        </span>
      </Link>

      {/* Nav List */}
      <nav className="flex flex-1 flex-col gap-2 w-full items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const isHovered = hoveredItem === item.name;

          return (
            <div
              key={item.name}
              className="relative flex w-full justify-center"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.12)]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isHovered && !isActive ? 'scale-110' : ''
                  }`}
                />

                {/* Active left glow strip */}
                {isActive && (
                  <span className="absolute -left-2 top-[11px] h-5 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_8px_#3b82f6]" />
                )}
              </Link>

              {/* Tooltip */}
              <div
                className={`sidebar-tooltip absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 rounded-lg border border-slate-700/80 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-100 shadow-xl whitespace-nowrap ${
                  isHovered
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-1 pointer-events-none'
                }`}
                style={{ transition: 'opacity 0.15s ease, transform 0.15s ease' }}
              >
                {item.name}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700/80" />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Version Tag */}
      <div className="text-[10px] font-semibold text-slate-600 tracking-wider">
        v1.0
      </div>
    </aside>
  );
}
