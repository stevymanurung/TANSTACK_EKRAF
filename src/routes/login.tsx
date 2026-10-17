import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, Fingerprint, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getServerSession } from "@/lib/server/auth";
/* Keep the login route renderable even when a stale or partially valid session cookie exists.
 * Protected routes perform the authoritative server-side session check. This avoids
 * a /login <-> /dashboard redirect loop during local development and after deploys.
 */
export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /^[A-Z]/.test(password),
    dot: password.includes("."),
    number: /\d/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);
  const passwordIsValid = passwordRules.length && passwordRules.uppercase && passwordRules.dot && passwordRules.number;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "signup") {
      // Role selection is a request only. Public registration must never grant
      // administrator privileges; an existing administrator must assign that role.
      if (selectedRole === "admin") {
        setError("Pembuatan akun Administrator harus dilakukan atau disetujui oleh administrator yang sudah berwenang. Pilih Pengguna untuk pendaftaran biasa.");
        return;
      }
      if (!passwordIsValid) {
        setError("Password belum memenuhi semua ketentuan keamanan di bawah.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Konfirmasi password belum sama dengan password.");
        return;
      }
    }
    setLoading(true);
    try {
      const result = mode === "signin"
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ email: email.trim(), password, name: name.trim() });
      if (result.error) {
        setError(mode === "signin" ? "Email atau password tidak sesuai. Periksa kembali lalu coba lagi." : result.error.message || "Akun gagal dibuat. Silakan coba lagi.");
        return;
      }
      if (mode === "signin") {
        // The chosen role is only a request. The server-side role assigned to
        // this account remains authoritative.
        const current = await getServerSession();
        if (current.role !== selectedRole) {
          await authClient.signOut();
          setError(selectedRole === "admin"
            ? "Akun ini tidak memiliki hak administrator. Pilih Masuk sebagai Pengguna atau gunakan akun administrator yang sah."
            : "Akun ini terdaftar sebagai administrator. Pilih Masuk sebagai Administrator.");
          return;
        }
      }
      await navigate({ to: "/dashboard" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => current === "signin" ? "signup" : "signin");
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="auth-page auth-page-v2">
      <div className="auth-v2-grid" aria-hidden="true" />
      <section className="auth-v2-layout rise-in">
        <aside className="auth-v2-showcase">
          <Link to="/" className="auth-v2-brand"><span className="auth-v2-brand-mark"><Leaf size={21} /></span><span>ekraf<span className="auth-v2-brand-dot">.</span><small>CREATIVE WORKSPACE</small></span></Link>
          <div className="auth-v2-story">
            <span className="auth-v2-kicker"><Sparkles size={14} /> IDE BAIK, EKSEKUSI LEBIH RAPI</span>
            <h1>Tempat ide<br />berubah jadi<br /><em>karya nyata.</em></h1>
            <p>Temukan, unggah, dan kelola produk kreatif bersama komunitas dalam satu ruang yang sederhana dan aman.</p>
            <div className="auth-v2-benefits">
              <div><span><Check size={15} /></span><p><strong>Katalog lebih teratur</strong><small>Temukan produk dan pantau stok tanpa ribet.</small></p></div>
              <div><span><Check size={15} /></span><p><strong>Berkarya bersama</strong><small>Setiap anggota dapat mengelola katalog produk.</small></p></div>
            </div>
          </div>
          <div className="auth-v2-showcase-footer"><span><ShieldCheck size={15} /> Workspace terlindungi</span><span>EST. FOR CREATIVE TEAMS</span></div>
          <div className="auth-v2-orbit auth-v2-orbit-a" /><div className="auth-v2-orbit auth-v2-orbit-b" />
        </aside>

        <div className="auth-v2-form-side">
          <div className="auth-v2-form-top">
            <span className="auth-v2-secure"><Fingerprint size={15} /> SECURE ACCESS</span>
            {mode === "signin" ? (
              <button type="button" className="auth-v2-top-signup" onClick={switchMode}>Buat akun <ArrowRight size={15} /></button>
            ) : (
              <button type="button" className="auth-v2-top-signup" onClick={switchMode}>Sudah punya akun? Masuk</button>
            )}
          </div>
          <section className="auth-v2-card">
            <div className="auth-v2-mobile-brand"><span className="auth-v2-brand-mark"><Leaf size={19} /></span><strong>ekraf<span className="auth-v2-brand-dot">.</span></strong></div>
            <div className="auth-v2-card-heading"><span className="auth-v2-step">{mode === "signin" ? "01 / SIGN IN" : "01 / CREATE ACCOUNT"}</span><h2>{mode === "signin" ? "Senang melihatmu lagi." : "Gabung ke komunitas EKRAF."}</h2><p>{mode === "signin" ? "Masuk menggunakan akun yang sudah terdaftar." : "Buat akun dan siapkan ruang kerja kreatifmu."}</p></div>
            {<div className="auth-v2-role-options" role="group" aria-label={mode === "signin" ? "Pilih jenis login" : "Pilih jenis akun yang ingin dibuat"}>
              <button type="button" className={`auth-v2-role-option ${selectedRole === "user" ? "is-selected" : ""}`} onClick={() => { setSelectedRole("user"); setError(""); }} aria-pressed={selectedRole === "user"}><span className="auth-v2-role-icon"><UserPlus size={18} /></span><span><strong>{mode === "signin" ? "Masuk sebagai Pengguna" : "Buat akun Pengguna"}</strong><small>{mode === "signin" ? "Kelola produk katalog" : "Daftar dan kelola produk katalog"}</small></span>{selectedRole === "user" && <Check size={17} />}</button>
              <button type="button" className={`auth-v2-role-option ${selectedRole === "admin" ? "is-selected" : ""}`} onClick={() => { setSelectedRole("admin"); setError(""); }} aria-pressed={selectedRole === "admin"}><span className="auth-v2-role-icon"><ShieldCheck size={18} /></span><span><strong>{mode === "signin" ? "Masuk sebagai Administrator" : "Buat akun Administrator"}</strong><small>{mode === "signin" ? "Kelola produk, akun, dan peran" : "Memerlukan persetujuan administrator yang berwenang"}</small></span>{selectedRole === "admin" && <Check size={17} />}</button>
            </div>}
            <form onSubmit={handleSubmit} className="auth-form auth-v2-form">
              {mode === "signup" && <label className="field-group"><span>Nama lengkap</span><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Stevy Manurung" autoComplete="name" required maxLength={100} /></label>}
              <label className="field-group"><span>Alamat email</span><span className="input-icon-wrap"><Mail size={17} /><input className="field-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" autoComplete="email" required maxLength={254} /></span></label>
              <label className="field-group"><span>Password</span><span className="input-icon-wrap"><LockKeyhole size={17} /><input className="field-input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "Contoh: Ekraf.2026" : "Masukkan password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} maxLength={128} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {mode === "signup" && <>
                <div className="password-guidance"><div className="password-guidance-heading"><span>Ketentuan password</span><span className={passwordIsValid ? "password-ready" : "password-pending"}>{passwordIsValid ? "Cukup kuat" : "Perlu dilengkapi"}</span></div>
                  <PasswordRule passed={passwordRules.length} label="Minimal 8 karakter" />
                  <PasswordRule passed={passwordRules.uppercase} label="Diawali huruf besar (A–Z)" />
                  <PasswordRule passed={passwordRules.dot} label="Mengandung titik (.)" />
                  <PasswordRule passed={passwordRules.number} label="Mengandung minimal satu angka" />
                </div>
                <label className="field-group"><span>Konfirmasi password</span><span className="input-icon-wrap"><LockKeyhole size={17} /><input className="field-input" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi password" autoComplete="new-password" required maxLength={128} /><button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{confirmPassword.length > 0 && <small className={passwordRules.match ? "confirm-match" : "confirm-mismatch"}>{passwordRules.match ? "Password sudah cocok." : "Password belum cocok."}</small>}</label>
              </>}
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="button-primary auth-submit auth-v2-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Memproses…</> : <>{mode === "signin" ? "Masuk ke workspace" : "Buat akun"}<ArrowRight size={17} /></>}</button>
            </form>
            <div className="auth-v2-switch">
              {mode === "signin" ? (
                <><span>Belum punya akun?</span> <button type="button" className="auth-v2-create-account" onClick={switchMode}><UserPlus size={16} /> Buat akun baru</button></>
              ) : (
                <>Sudah punya akun? <button type="button" onClick={switchMode}>Masuk di sini</button></>
              )}
            </div>
            <p className="auth-v2-registration-note">Pilih jenis akun di atas. Demi keamanan, pilihan Administrator saat pendaftaran tidak langsung memberikan hak admin; akun Administrator harus dibuat atau disetujui oleh administrator yang sudah berwenang.</p>
            <div className="auth-v2-note"><LockKeyhole size={14} /><span>Jangan gunakan password yang sama dengan akun penting lainnya.</span></div>
          </section>
          <p className="auth-v2-copyright">© {new Date().getFullYear()} EKRAF WORKSPACE <span>•</span> Built for creative teams</p>
        </div>
      </section>
    </main>
  );
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return <div className={`password-rule ${passed ? "is-passed" : ""}`}>{passed ? <Check size={13} /> : <X size={13} />}<span>{label}</span></div>;
}
