"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authStorage, api, User } from "@/lib/api";
import {
  Activity,
  Users,
  UserPlus,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Hospital,
  ChevronDown,
} from "lucide-react";

export function StaffNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [pendingAlertsCount, setPendingAlertsCount] = useState<number>(0);

  useEffect(() => {
    const currentUser = authStorage.getUser();
    setUser(currentUser);

    // Fetch stats for alerts badge
    api.getStats()
      .then((data) => setPendingAlertsCount(data.requiring_review))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = () => {
    authStorage.clear();
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Activity },
    { label: "Patients", href: "/patients", icon: Users },
    { label: "New Discharge", href: "/discharges/new", icon: UserPlus },
    {
      label: "Alerts Queue",
      href: "/alerts",
      icon: Bell,
      badge: pendingAlertsCount > 0 ? pendingAlertsCount : null,
    },
    { label: "Notification Log", href: "/notifications", icon: MessageSquare },
    { label: "Audit Trail", href: "/audit", icon: ShieldCheck },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Hospital */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/logo.png"
                  alt="AfterCare Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  After<span className="text-purple-600">Care</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-1 tracking-wide uppercase">
                  Clinical Recovery Platform
                </span>
              </div>
            </Link>

            {/* Hospital pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <Hospital className="w-3.5 h-3.5 text-teal-600" />
              <span>St. Jude Orthopedic & Surgical Centre</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? "text-teal-700 bg-teal-50/80 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full leading-none animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile & logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                    <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                      {user.role}
                    </span>
                    <span>• {user.department}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile secondary nav */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "text-teal-700 bg-teal-50 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

