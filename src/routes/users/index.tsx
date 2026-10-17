import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, ShieldCheck, Shield, Trash2, Users as UsersIcon, UserRound, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import type { Role } from "@/lib/db";
import { UserRoleModal } from "@/components/users/UserRoleModal";
import { getServerSession } from "@/lib/server/auth";
import { deleteUser, getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/users/")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    if (!session) throw redirect({ to: "/login" });
    try { await getUsers(); } catch { throw redirect({ to: "/setup" }); }
  },
  component: Users,
});

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
};

function Users() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers(), retry: false });
  const deleteFn = useServerFn(deleteUser);
  const [search, setSearch] = useState("");
  const [busyUser, setBusyUser] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | undefined>();
  const users = usersQuery.data ?? [];
  const admins = users.filter((user) => user.role === "admin").length;
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name ?? ""} ${user.email}`.toLowerCase().includes(search.toLowerCase())), [users, search]);


  async function removeUser(user: UserRow) {
    if (!window.confirm(`Hapus akun ${user.name || user.email}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyUser(user.id); setError(""); setNotice("");
    try {
      await deleteFn({ data: { userId: user.id } });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setNotice(`Akun ${user.name || user.email} berhasil dihapus.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengguna gagal dihapus.");
    } finally { setBusyUser(""); }
  }

  if (usersQuery.isError) {
    return <main className="app-main page-wrap"><section className="users-error-panel"><span className="users-stat-icon"><Shield size={22} /></span><h1>Akses administrator diperlukan</h1><p>Halaman manajemen pengguna hanya tersedia untuk akun administrator.</p><button className="button-secondary" onClick={() => void usersQuery.refetch()}><RefreshCw size={16} /> Coba lagi</button></section></main>;
  }

  return <main className="app-main page-wrap users-page">
    <section className="page-heading users-heading"><div><span className="eyebrow"><span className="status-dot" /> RUANG KERJA / AKSES</span><h1>Manajemen pengguna</h1><p>Kelola akun, tinjau status verifikasi, dan atur akses workspace dengan aman.</p></div><span className="heading-icon"><UsersIcon size={24} /></span></section>
    <section className="users-stats-grid">
      <article className="users-stat-card"><span className="users-stat-icon"><UsersIcon size={19} /></span><div><span>Total pengguna</span><strong>{usersQuery.isPending ? "—" : users.length}</strong><small>Seluruh akun terdaftar</small></div></article>
      <article className="users-stat-card"><span className="users-stat-icon admin"><ShieldCheck size={19} /></span><div><span>Administrator</span><strong>{usersQuery.isPending ? "—" : admins}</strong><small>Memiliki akses penuh</small></div></article>
      <article className="users-stat-card"><span className="users-stat-icon verified"><UserRound size={19} /></span><div><span>Email terverifikasi</span><strong>{usersQuery.isPending ? "—" : users.filter((user) => user.emailVerified).length}</strong><small>Dari semua pengguna</small></div></article>
    </section>
    <section className="users-panel">
      <div className="users-panel-heading"><div><h2>Daftar akun</h2><p>{filteredUsers.length} pengguna ditampilkan</p></div><label className="users-search"><Search size={17} /><input aria-label="Cari pengguna" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email…" /></label></div>
      {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="form-success" role="status">{notice}</div>}
      {usersQuery.isPending ? <div className="loading-panel"><span className="spinner" /> Memuat daftar pengguna…</div> : filteredUsers.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><UsersIcon size={24} /></span><h3>{search ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}</h3><p>{search ? "Coba kata kunci lain." : "Akun yang terdaftar akan muncul di sini."}</p></div> : <>
        <div className="users-table-wrap"><table className="users-table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status email</th><th>Bergabung</th><th className="users-action-column">Tindakan</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><div className="user-identity"><span className="user-avatar">{(user.name || user.email).charAt(0).toUpperCase()}</span><span><strong>{user.name || "Tanpa nama"}</strong><small>{user.email}</small></span></div></td><td><span className={`role-badge ${user.role === "admin" ? "role-admin" : "role-user"}`}>{user.role === "admin" ? <ShieldCheck size={13} /> : <UserRound size={13} />}{user.role === "admin" ? "Administrator" : "Pengguna"}</span></td><td><span className={`verification-badge ${user.emailVerified ? "is-verified" : "is-unverified"}`}><i />{user.emailVerified ? "Terverifikasi" : "Belum diverifikasi"}</span></td><td>{new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td><td><div className="user-row-actions"><button className="role-edit-button" type="button" disabled={busyUser === user.id} onClick={() => setSelectedUser(user)}>Ubah peran</button><button className="icon-action danger-action" type="button" aria-label={`Hapus ${user.email}`} title="Hapus akun" disabled={busyUser === user.id || (user.role === "admin" && admins <= 1)} onClick={() => void removeUser(user)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
        <div className="users-mobile-list">{filteredUsers.map((user) => <article className="user-mobile-card" key={user.id}><div className="user-mobile-head"><div className="user-identity"><span className="user-avatar">{(user.name || user.email).charAt(0).toUpperCase()}</span><span><strong>{user.name || "Tanpa nama"}</strong><small>{user.email}</small></span></div><span className={`role-badge ${user.role === "admin" ? "role-admin" : "role-user"}`}>{user.role === "admin" ? "Admin" : "Pengguna"}</span></div><div className="user-mobile-meta"><span className={`verification-badge ${user.emailVerified ? "is-verified" : "is-unverified"}`}><i />{user.emailVerified ? "Terverifikasi" : "Belum diverifikasi"}</span><small>Bergabung {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</small></div><div className="user-mobile-actions"><button className="button-secondary" type="button" disabled={busyUser === user.id} onClick={() => setSelectedUser(user)}>Ubah peran</button><button className="button-danger" type="button" disabled={busyUser === user.id || (user.role === "admin" && admins <= 1)} onClick={() => void removeUser(user)}><Trash2 size={15} /> Hapus akun</button></div></article>)}</div>
      </>}
      <div className="users-panel-foot"><ShieldCheck size={16} /><span>Perubahan peran dan penghapusan akun diverifikasi ulang di server.</span></div>
    </section>
    {selectedUser && <UserRoleModal user={selectedUser} adminCount={admins} onClose={() => setSelectedUser(undefined)} onSaved={() => { setSelectedUser(undefined); setNotice(`Peran ${selectedUser.name || selectedUser.email} berhasil diperbarui.`); setError(""); }} />}
  </main>;
}
