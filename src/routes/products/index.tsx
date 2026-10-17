import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownUp, Boxes, CircleDollarSign, Package, Plus, Search, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { Product } from "@/lib/db";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { getServerSession } from "@/lib/server/auth";
import { deleteProduct, getProducts } from "@/lib/server/products";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/products/")({
  beforeLoad: async () => { const { session } = await getServerSession(); if (!session) throw redirect({ to: "/login" }); },
  component: Products,
});

function Products() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers(), retry: false });
  const deleteFn = useServerFn(deleteProduct);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "name" | "price">("newest");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | undefined>();
  const isAdmin = usersQuery.isSuccess;
  const products = productsQuery.data ?? [];
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "price" ? a.price - b.price : b.createdAt.localeCompare(a.createdAt)), [products, search, sort]);
  const totalValue = products.reduce((total, product) => total + product.price * product.stock, 0);

  function openCreateModal() { setModalProduct(undefined); setModalOpen(true); }
  function openEditModal(product: Product) { setModalProduct(product); setModalOpen(true); }

  async function removeProduct(product: Product) {
    if (!isAdmin || !window.confirm(`Hapus produk “${product.name}”?`)) return;
    setError("");
    try { await deleteFn({ data: { id: product.id } }); await queryClient.invalidateQueries({ queryKey: ["products"] }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Produk gagal dihapus."); }
  }

  return <main className="app-main page-wrap"><section className="page-heading products-heading"><div><span className="eyebrow"><span className="status-dot" /> RUANG KERJA / KATALOG</span><h1>Produk</h1><p>Semua produk dalam satu tempat. Cari, periksa stok, dan kelola katalog dengan mudah.</p></div>{isAdmin && <button type="button" className="button-primary" onClick={openCreateModal}><Plus size={18} /> Tambah produk</button>}</section>
    <section className="metrics-grid metrics-grid-three"><Metric icon={<Package size={19} />} label="Total produk" value={String(products.length)} detail="Produk terdaftar" /><Metric icon={<Boxes size={19} />} label="Unit tersedia" value={products.reduce((total, product) => total + product.stock, 0).toLocaleString("id-ID")} detail="Akumulasi stok" /><Metric icon={<CircleDollarSign size={19} />} label="Nilai persediaan" value={totalValue.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })} detail="Harga × stok" /></section>
    <section className="catalog-panel"><div className="catalog-toolbar"><div><h2>Daftar katalog</h2><p>{filteredProducts.length} dari {products.length} produk ditampilkan</p></div><div className="catalog-controls"><label className="search-field"><Search size={17} /><input aria-label="Cari produk" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk…" /></label><label className="sort-field"><ArrowDownUp size={15} /><select aria-label="Urutkan produk" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="newest">Terbaru</option><option value="name">Nama A–Z</option><option value="price">Harga terendah</option></select></label></div></div>
      {productsQuery.isPending ? <div className="loading-panel"><span className="spinner" /> Memuat katalog produk…</div> : productsQuery.isError ? <div className="empty-state"><span className="empty-state-icon"><Boxes size={25} /></span><h3>Katalog belum bisa dimuat</h3><p>{productsQuery.error.message}</p><button className="button-secondary" onClick={() => void productsQuery.refetch()}>Coba lagi</button></div> : filteredProducts.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><ShoppingBag size={25} /></span><h3>{search ? "Produk tidak ditemukan" : "Katalog masih kosong"}</h3><p>{search ? "Coba kata kunci lain atau hapus pencarian." : "Tambahkan produk pertama untuk mulai membangun katalog."}</p>{search ? <button className="button-secondary" onClick={() => setSearch("")}>Hapus pencarian</button> : isAdmin && <button type="button" className="button-primary" onClick={openCreateModal}><Plus size={16} /> Tambah produk</button>}</div> : <div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image-wrap">{product.imageUrl ? <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" /> : <div className="product-image-placeholder"><Sparkles size={25} /><span>EKRAF PRODUCT</span></div>}<span className={`stock-pill ${product.stock === 0 ? "stock-empty" : product.stock < 5 ? "stock-low" : "stock-available"}`}>{product.stock === 0 ? "Habis" : product.stock < 5 ? "Stok menipis" : "Tersedia"}</span></div><div className="product-card-body"><div className="product-card-title-row"><h3>{product.name}</h3><strong>{product.price.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</strong></div><p className="product-description">{product.description}</p><div className="product-card-meta"><span><Package size={14} /> {product.stock} unit</span><span>Diperbarui {new Date(product.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span></div><div className="product-card-actions"><Link to="/products/$productId" params={{ productId: product.id }} className="button-secondary product-edit-button">Lihat detail</Link>{isAdmin && <button type="button" className="icon-action" aria-label={`Edit ${product.name}`} title="Edit produk" onClick={() => openEditModal(product)}><Sparkles size={16} /></button>}{isAdmin && <button type="button" className="icon-action danger-action" aria-label={`Hapus ${product.name}`} title="Hapus produk" onClick={() => void removeProduct(product)}><Trash2 size={16} /></button>}</div></div></article>)}</div>}
      {error && <div className="form-error catalog-error" role="alert">{error}</div>}
    </section>
    {modalOpen && isAdmin && <ProductFormModal product={modalProduct} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); setModalProduct(undefined); setError(""); }} />}
  </main>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <article className="metric-card"><span className="metric-icon">{icon}</span><div className="metric-copy"><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}
