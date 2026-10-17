import { Boxes, LayoutDashboard, Leaf, Menu, Users, X } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import BetterAuthHeader from "../integrations/better-auth/header-user";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/products" as const, label: "Produk", icon: Boxes },
  { to: "/users" as const, label: "Pengguna", icon: Users },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/login") return null;

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link to="/" className="brand-lockup"><span className="brand-mark"><Leaf size={20} /></span><span>EKRAF<span className="brand-dot">.</span><small>CREATIVE COMMERCE</small></span></Link>
        <button className="mobile-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <div className={`site-nav-links ${menuOpen ? "is-open" : ""}`}>
          {navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className={`site-nav-link ${pathname === to || pathname.startsWith(`${to}/`) ? "is-active" : ""}`} onClick={() => setMenuOpen(false)}><Icon size={16} /> {label}</Link>)}
          <div className="site-nav-actions"><ThemeToggle /><BetterAuthHeader /></div>
        </div>
      </nav>
    </header>
  );
}
