import { ArrowLeft, Check, Image as ImageIcon, Save, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { ProductImageInput } from "@/components/products/ProductImageInput";
import { getServerSession } from "@/lib/server/auth";
import { getUsers } from "@/lib/server/users";
import { deleteProduct, getProducts, updateProduct } from "@/lib/server/products";
import type { Product } from "@/lib/db";

export const Route = createFileRoute("/products/$productId")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    if (!session) throw redirect({ to: "/login" });
    try { await getUsers(); } catch { throw redirect({ to: "/setup" }); }
  },
  component: EditProduct,
});

function EditProduct() {
  const { productId } = useParams({ from: "/products/$productId" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const updateFn = useServerFn(updateProduct);
  const deleteFn = useServerFn(deleteProduct);
  const productQuery = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers(), retry: false });
  const product = productQuery.data?.find((item) => item.id === productId);
  if (productQuery.isPending) return <main className="app-main page-wrap"><div className="loading-panel"><span className="spinner" /> Memuat detail produk…</div></main>;
  if (productQuery.isError) return <main className="app-main page-wrap"><div className="empty-state"><h2>Produk gagal dimuat</h2><p>{productQuery.error.message}</p><Link to="/products" className="button-secondary">Kembali ke produk</Link></div></main>;
  if (!product) return <main className="app-main page-wrap"><div className="empty-state"><h2>Produk tidak ditemukan</h2><p>Produk mungkin sudah dihapus atau tidak tersedia.</p><Link to="/products" className="button-primary">Kembali ke katalog</Link></div></main>;
  if (usersQuery.isPending) return <main className="app-main page-wrap"><div className="loading-panel"><span className="spinner" /> Memeriksa hak akses…</div></main>;
  if (usersQuery.isError) return <ProductReadOnly product={product} />;
  return <ProductEditor key={product.id} product={product} updateFn={updateFn} deleteFn={deleteFn} queryClient={queryClient} navigate={navigate} />;
}


function ProductReadOnly({ product }: { product: Product }) {
  return <main className="app-main page-wrap"><div className="page-heading"><div><Link to="/products" className="back-link"><ArrowLeft size={16} /> Kembali ke katalog</Link><span className="eyebrow">KATALOG PRODUK / DETAIL</span><h1>{product.name}</h1><p>Informasi produk dalam katalog workspace.</p></div><span className="heading-icon"><ImageIcon size={24} /></span></div>
    <section className="product-readonly-card"><div className="product-readonly-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <ImageIcon size={38} />}</div><div className="product-readonly-copy"><span className={`stock-pill ${product.stock === 0 ? "stock-empty" : product.stock < 5 ? "stock-low" : "stock-available"}`}>{product.stock === 0 ? "Stok habis" : product.stock < 5 ? "Stok menipis" : "Tersedia"}</span><h2>{product.price.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</h2><p>{product.description}</p><div className="product-readonly-meta"><span><strong>Stok</strong>{product.stock} unit</span><span><strong>Dibuat</strong>{new Date(product.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span><span><strong>Diperbarui</strong>{new Date(product.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span></div></div></section>
  </main>;
}

function ProductEditor({ product, updateFn, deleteFn, queryClient, navigate }: {
  product: Product;
  updateFn: (opts: { data: { id: string; name: string; description: string; imageUrl?: string; price: number; stock: number } }) => Promise<unknown>;
  deleteFn: (opts: { data: { id: string } }) => Promise<unknown>;
  queryClient: ReturnType<typeof useQueryClient>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setName(product.name); setDescription(product.description); setPrice(String(product.price)); setStock(String(product.stock)); setImageUrl(product.imageUrl || ""); }, [product]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    try {
      await updateFn({ data: { id: product.id, name: name.trim(), description: description.trim(), price: Number(price), stock: Number(stock), imageUrl } });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setNotice("Perubahan produk berhasil disimpan.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Produk gagal diperbarui."); }
    finally { setSaving(false); }
  }

  async function removeProduct() {
    if (!window.confirm(`Hapus produk “${product.name}”? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeleting(true); setError("");
    try { await deleteFn({ data: { id: product.id } }); await queryClient.invalidateQueries({ queryKey: ["products"] }); await navigate({ to: "/products" }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Produk gagal dihapus."); setDeleting(false); }
  }

  return <main className="app-main page-wrap"><div className="page-heading"><div><Link to="/products" className="back-link"><ArrowLeft size={16} /> Kembali ke produk</Link><span className="eyebrow">KATALOG PRODUK / EDIT</span><h1>Edit produk</h1><p>Perbarui informasi produk tanpa kehilangan data yang sudah ada.</p></div><span className="heading-icon"><ImageIcon size={24} /></span></div>
    <form className="editor-card" onSubmit={submit}><div className="editor-section-heading"><span className="section-number">01</span><div><h2>Informasi utama</h2><p>Perubahan akan langsung terlihat setelah disimpan.</p></div></div>
      <div className="field-grid"><label className="field-group field-span-2"><span>Nama produk <b>*</b></span><input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></label><label className="field-group field-span-2"><span>Deskripsi <b>*</b></span><textarea className="field-input field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={2000} rows={4} /></label></div>
      <div className="editor-section-heading editor-section-separated"><span className="section-number">02</span><div><h2>Foto produk</h2><p>Ganti, unggah, atau hapus gambar produk.</p></div></div><ProductImageInput value={imageUrl} onChange={setImageUrl} />
      <div className="editor-section-heading editor-section-separated"><span className="section-number">03</span><div><h2>Harga dan stok</h2><p>Periksa kembali harga dan ketersediaan produk.</p></div></div>
      <div className="field-grid"><label className="field-group"><span>Harga (Rupiah) <b>*</b></span><div className="money-input"><span>Rp</span><input className="field-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div></label><label className="field-group"><span>Stok <b>*</b></span><input className="field-input" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} required /></label></div>
      {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="form-success" role="status">{notice}</div>}
      <div className="editor-actions editor-actions-between"><button type="button" className="button-danger" onClick={() => void removeProduct()} disabled={saving || deleting}><Trash2 size={16} /> {deleting ? "Menghapus…" : "Hapus produk"}</button><div className="editor-actions-right"><Link to="/products" className="button-secondary">Batal</Link><button className="button-primary" type="submit" disabled={saving || deleting}>{saving ? <><span className="spinner" /> Menyimpan…</> : <><Save size={17} /> Simpan perubahan</>}</button></div></div>
    </form>
  </main>;
}
