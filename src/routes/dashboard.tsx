import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, CircleDollarSign, Package, Plus, ShieldCheck, Sparkles, Users } from "lucide-react";

import { getServerSession } from "@/lib/server/auth";
import { getProducts } from "@/lib/server/products";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => { const { session } = await getServerSession(); if (!session) throw redirect({ to: "/login" }); try { await getUsers(); } catch { throw redirect({ to: "/setup" }); } },
  component: Dashboard,
});

function Dashboard() {
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers(), retry: false });
  const products = productsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const adminCount = users.filter((user) => user.role === "admin").length;
  const stockCount = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  return <main className="app-main page-wrap"><section className="dashboard-hero"><div className="dashboard-hero-content"><span className="eyebrow hero-eyebrow"><span className="status-dot" /> WORKSPACE OVERVIEW</span><h1>Ruang kreatif,<br /><span>terkendali.</span></h1><p>Selamat datang kembali. Pantau katalog, stok, dan aktivitas workspace-mu dari satu tempat.</p><div className="hero-actions"><Link to="/products" className="button-primary">Jelajahi produk <ArrowRight size={17} /></Link><Link to="/users" className="button-light"><Users size={17} /> Kelola pengguna</Link></div></div><div className="dashboard-hero-art" aria-hidden="true"><div className="hero-art-orbit orbit-one" /><div className="hero-art-orbit orbit-two" /><div className="hero-art-center"><Sparkles size={36} /></div><span className="hero-art-chip chip-top"><Boxes size={15} /> Katalog</span><span className="hero-art-chip chip-bottom"><ShieldCheck size={15} /> Terproteksi</span></div></section>
    <div className="section-heading"><div><span className="eyebrow">RINGKASAN</span><h2>Workspace dalam angka</h2></div><span className="live-badge"><span className="status-dot" /> Data saat ini</span></div>
    <section className="metrics-grid metrics-grid-four"><Metric icon={<Package size={19} />} label="Total produk" value={productsQuery.isPending ? "—" : String(products.length)} detail="Produk di katalog" tone="mint" /><Metric icon={<Boxes size={19} />} label="Total stok" value={productsQuery.isPending ? "—" : stockCount.toLocaleString("id-ID")} detail="Unit tersedia" tone="blue" /><Metric icon={<CircleDollarSign size={19} />} label="Nilai persediaan" value={productsQuery.isPending ? "—" : inventoryValue.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })} detail="Harga × jumlah stok" tone="gold" /><Metric icon={<Users size={19} />} label="Pengguna" value={usersQuery.isSuccess ? String(users.length) : "—"} detail={usersQuery.isSuccess ? `${adminCount} administrator` : "Khusus administrator"} tone="violet" /></section>
    {productsQuery.isError && <div className="form-error" role="alert">Produk gagal dimuat: {productsQuery.error.message}</div>}
    <section className="dashboard-lower-grid"><article className="content-panel"><div className="panel-heading"><div><span className="eyebrow">KATALOG</span><h2>Produk terbaru</h2></div><Link to="/products" className="text-link">Lihat semua <ArrowRight size={15} /></Link></div>{productsQuery.isPending ? <div className="loading-panel"><span className="spinner" /> Memuat produk…</div> : products.length === 0 ? <div className="compact-empty"><Package size={23} /><p>Belum ada produk di katalog.</p><Link to="/products/new" className="text-link">Tambah produk <ArrowRight size={15} /></Link></div> : <div className="recent-product-list">{[...products].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,4).map((product) => <div className="recent-product" key={product.id}><div className="recent-product-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <Package size={19} />}</div><div className="recent-product-info"><strong>{product.name}</strong><span>{product.stock} unit tersedia</span></div><strong className="recent-product-price">{product.price.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</strong><Link to="/products/$productId" params={{ productId: product.id }} className="recent-product-open" aria-label={`Lihat ${product.name}`}><ArrowUpRight size={17} /></Link></div>)}</div>}</article>
      <article className="content-panel quick-actions-panel"><div className="panel-heading"><div><span className="eyebrow">PINTASAN</span><h2>Apa yang ingin dilakukan?</h2></div></div>{usersQuery.isSuccess && <Link to="/products/new" className="quick-action"><span className="quick-action-icon mint"><Plus size={19} /></span><span><strong>Tambah produk</strong><small>Masukkan produk ke katalog</small></span><ArrowRight size={17} /></Link>}<Link to="/products" className="quick-action"><span className="quick-action-icon blue"><Boxes size={19} /></span><span><strong>Kelola katalog</strong><small>Cari dan perbarui produk</small></span><ArrowRight size={17} /></Link>{usersQuery.isSuccess && <Link to="/users" className="quick-action"><span className="quick-action-icon violet"><Users size={19} /></span><span><strong>Manajemen pengguna</strong><small>Atur akun dan peran</small></span><ArrowRight size={17} /></Link>}<div className="security-note"><ShieldCheck size={18} /><p><strong>Keamanan aktif</strong><span>Perubahan sensitif diverifikasi di server.</span></p></div></article></section>
    {usersQuery.isError && <p className="subtle-note">Ringkasan pengguna hanya tersedia untuk administrator.</p>}
  </main>;
}

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><div className="metric-copy"><p>{label}</p><strong>{value}</strong><span>{detail}</span></div><span className="metric-trend"><ArrowDownRight size={16} /></span></article>;
}
