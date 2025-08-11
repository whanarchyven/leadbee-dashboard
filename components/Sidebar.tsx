"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm transition-colors ${
        active ? "bg-black text-white" : "hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const who = useQuery(api.stats.whoAmI, {});
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) return null;

  return (
    <aside className="h-screen sticky top-0 w-60 border-r bg-white/60 backdrop-blur p-4 flex flex-col">
      <div className="text-sm font-semibold mb-4">Overview dashboard</div>
      <nav className="grid gap-1">
        <NavItem href="/" label="Сводка" active={pathname === "/"} />
        <NavItem href="/dialogs" label="Диалоги" active={pathname === "/dialogs"} />
        {who?.email === "youthful.swordfish892@mail.com" && (
          <NavItem href="/admin" label="Настройка" active={pathname === "/admin"} />
        )}
      </nav>
      <div className="mt-auto pt-4 border-t">
        {isAuthenticated && (
          <button
            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100"
            onClick={() => void signOut()}
          >
            Выйти
          </button>
        )}
      </div>
    </aside>
  );
}


