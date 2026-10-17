import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import type { Role } from "@/lib/db";
import { updateUserRole } from "@/lib/server/users";

type UserRoleTarget = { id: string; email: string; name: string | null; role: Role };

export function UserRoleModal({ user, adminCount, onClose, onSaved }: { user: UserRoleTarget; adminCount: number; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const updateRoleFn = useServerFn(updateUserRole);
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === user.role) { onClose(); return; }
    setError(""); setSaving(true);
    try {
      await updateRoleFn({ data: { userId: user.id, role } });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Peran pengguna gagal diperbarui."); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape" && !saving) onClose(); }} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="app-modal role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <header className="app-modal-header"><span className="modal-icon"><ShieldCheck size={20} /></span><div><h2 id="role-modal-title">Ubah peran pengguna</h2><p>Atur tingkat akses akun di workspace.</p></div><button className="modal-close" type="button" onClick={onClose} disabled={saving} aria-label="Tutup modal"><X size={19} /></button></header>
      <form onSubmit={submit} className="app-modal-form"><div className="modal-form-scroll"><div className="role-target-card"><span className="user-avatar">{(user.name || user.email).charAt(0).toUpperCase()}</span><span><strong>{user.name || "Tanpa nama"}</strong><small>{user.email}</small></span></div>
        <label className="field-group"><span>Peran akun</span><select className="field-input" value={role} onChange={(event) => setRole(event.target.value as Role)} disabled={saving}><option value="user" disabled={user.role === "admin" && adminCount <= 1}>Pengguna — akses katalog</option><option value="admin">Administrator — kelola produk dan akun</option></select></label>
        <p className="modal-help"><ShieldCheck size={15} /> Administrator dapat membuat, mengubah, dan menghapus produk serta mengelola akun pengguna.</p>
        {error && <div className="form-error" role="alert">{error}</div>}</div>
        <footer className="app-modal-actions"><button className="button-secondary" type="button" onClick={onClose} disabled={saving}>Batal</button><button className="button-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Menyimpan…</> : "Simpan peran"}</button></footer>
      </form>
    </section>
  </div>;
}
