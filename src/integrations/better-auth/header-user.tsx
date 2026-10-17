import { LogIn, LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  if (isPending) return <span className="user-loading" aria-label="Memuat akun" />;
  if (session?.user) {
    return <div className="header-user"><span className="avatar-chip">{session.user.name?.charAt(0).toUpperCase() || "U"}</span><span className="header-user-name">{session.user.name || session.user.email}</span><button type="button" className="button-ghost header-signout" onClick={async () => { await authClient.signOut(); await navigate({ to: "/" }); }}><LogOut size={16} /><span>Keluar</span></button></div>;
  }
  return <Link to="/login" className="button-primary header-login"><LogIn size={16} /> Masuk</Link>;
}
