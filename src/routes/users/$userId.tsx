import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CalendarDays, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState } from "react";

import type { Role } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";
import { deleteUser, getUsers, updateUserRole } from "@/lib/server/users";

export const Route = createFileRoute("/users/$userId")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    if (!session) throw redirect({ to: "/login" });
    try { await getUsers(); } catch { throw redirect({ to: "/setup" }); }
  },
  component: UserDetail,
});

function UserDetail() {
  const { userId } = useParams({ from: "/users/$userId" });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers(), retry: false });
  if (usersQuery.isPending) return <main className="app-main page-wrap"><div className="loading-panel"><span className="spinner" /> Memuat detail pengguna…</div></main>;
  if (usersQuery.isError) return <main className="app-main page-wrap"><div className="empty-state"><h2>Detail pengguna tidak dapat dimuat</h2><p>{usersQuery.error.message}</p><Link to="/users" className="button-secondary">Kembali ke pengguna</Link></div></main>;
  const user = usersQuery.data.find((entry) => entry.id === userId);
  if (!user) return <main className="app-main page-wrap"><div className="empty-state"><h2>Pengguna tidak ditemukan</h2><p>Akun mungkin sudah dihapus atau tidak tersedia.</p><Link to="/users" className="button-primary">Kembali ke pengguna</Link></div></main>;
  return <UserDetailCard key={user.id} user={user} users={usersQuery.data} />;
}

function UserDetailCard({ user, users }: { user: { id: string; email: string; name: string | null; role: Role; emailVerified: boolean; createdAt: string }; users: Array<{ id: string; role: Role }> }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const updateRoleFn = useServerFn(updateUserRole);
  const deleteFn = useServerFn(deleteUser);
  const [role, setRole] = useState<Role>(user.role);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const adminCount = users.filter((entry) => entry.role === "admin").length;

  async function changeRole(nextRole: Role) {
    if (nextRole === role) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await updateRoleFn({ data: { userId: user.id, role: nextRole } });
      setRole(nextRole); setMessage("Peran pengguna berhasil diperbarui.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Peran gagal diperbarui."); }
    finally { setBusy(false); }
  }

  async function removeUser() {
    if (!window.confirm(`Hapus akun ${user.name || user.email}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true); setError("");
    try {
      await deleteFn({ data: { userId: user.id } });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await navigate({ to: "/users" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pengguna gagal dihapus."); setBusy(false); }
  }

  return <main className="app-main page-wrap"><div className="page-heading"><div><Link to="/users" className="back-link"><ArrowLeft size={16} /> Kembali ke pengguna</Link><span className="eyebrow">RUANG KERJA / AKUN</span><h1>Detail pengguna</h1><p>Informasi akun dan kontrol akses untuk pengguna workspace.</p></div><span className="heading-icon"><UserRound size={24} /></span></div>
    <section className="user-detail-card"><div className="user-detail-banner"><span className="user-detail-avatar">{(user.name || user.email).charAt(0).toUpperCase()}</span><div><h2>{user.name || "Tanpa nama"}</h2><p>{user.email}</p></div><span className={`role-badge ${role === "admin" ? "role-admin" : "role-user"}`}>{role === "admin" ? <ShieldCheck size={13} /> : <UserRound size={13} />}{role === "admin" ? "Administrator" : "Pengguna"}</span></div>
      <div className="user-detail-info-grid"><article><span><Mail size={16} /> Email</span><strong>{user.email}</strong><small>{user.emailVerified ? "Email terverifikasi" : "Email belum terverifikasi"}</small></article><article><span><CalendarDays size={16} /> Bergabung</span><strong>{new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong><small>Tanggal akun dibuat</small></article><article><span><ShieldCheck size={16} /> Peran akun</span><label className="sr-only" htmlFor="user-detail-role">Peran akun</label><select id="user-detail-role" value={role} disabled={busy || (role === "admin" && adminCount <= 1)} onChange={(event) => void changeRole(event.target.value as Role)}><option value="user">Pengguna</option><option value="admin">Administrator</option></select><small>Menentukan akses yang tersedia</small></article></div>
      {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}
      <div className="editor-actions editor-actions-between"><p className="user-detail-security"><ShieldCheck size={16} /> Perubahan diverifikasi di server.</p><button type="button" className="button-danger" onClick={() => void removeUser()} disabled={busy || (role === "admin" && adminCount <= 1)}><Trash2 size={16} /> {busy ? "Memproses…" : "Hapus pengguna"}</button></div>
    </section>
  </main>;
}
