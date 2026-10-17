import { Leaf } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

export default function Footer() {
  const year = new Date().getFullYear();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/login") return null;
  return <footer className="site-footer"><div className="site-footer-inner"><Link to="/" className="brand-lockup footer-brand"><span className="brand-mark"><Leaf size={18} /></span><span>EKRAF<span className="brand-dot">.</span><small>CREATIVE COMMERCE</small></span></Link><p>Workspace yang lebih rapi untuk ide yang lebih besar.</p><span className="footer-copyright">© {year} EKRAF Workspace</span></div></footer>;
}
