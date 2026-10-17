import { ArrowLeft, Check, PackagePlus } from "lucide-react";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { ProductImageInput } from "@/components/products/ProductImageInput";
import { createProduct } from "@/lib/server/products";
import { getServerSession } from "@/lib/server/auth";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/products/new")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    if (!session) throw redirect({ to: "/login" });
    try { await getUsers(); } catch { throw redirect({ to: "/dashboard" }); }
  },
  component: NewProduct,
});

function NewProduct() {
  const createFn = useServerFn(createProduct);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      await createFn({ data: { name: name.trim(), description: description.trim(), price: Number(price), stock: Number(stock), imageUrl } });
      await navigate({ to: "/products" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Produk gagal disimpan."); }
    finally { setSaving(false); }
  }

  return <main className="app-main page-wrap"><div className="page-heading"><div><Link to="/products" className="back-link"><ArrowLeft size={16} /> Kembali ke produk</Link><span className="eyebrow">KATALOG PRODUK</span><h1>Tambah produk</h1><p>Lengkapi informasi produk untuk menambahkannya ke katalog.</p></div><span className="heading-icon"><PackagePlus size={24} /></span></div>
    <form className="editor-card" onSubmit={submit}>
      <div className="editor-section-heading"><span className="section-number">01</span><div><h2>Informasi utama</h2><p>Nama dan deskripsi membantu tim mengenali produk.</p></div></div>
      <div className="field-grid"><label className="field-group field-span-2"><span>Nama produk <b>*</b></span><input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Paket Branding Premium" required maxLength={120} /></label><label className="field-group field-span-2"><span>Deskripsi <b>*</b></span><textarea className="field-input field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan detail dan manfaat produk…" required maxLength={2000} rows={4} /></label></div>
      <div className="editor-section-heading editor-section-separated"><span className="section-number">02</span><div><h2>Foto produk</h2><p>Gunakan foto yang jelas agar katalog lebih mudah dipindai.</p></div></div><ProductImageInput value={imageUrl} onChange={setImageUrl} />
      <div className="editor-section-heading editor-section-separated"><span className="section-number">03</span><div><h2>Harga dan stok</h2><p>Nilai dapat diperbarui kapan saja oleh administrator.</p></div></div>
      <div className="field-grid"><label className="field-group"><span>Harga (Rupiah) <b>*</b></span><div className="money-input"><span>Rp</span><input className="field-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div></label><label className="field-group"><span>Stok <b>*</b></span><input className="field-input" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} required /></label></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="editor-actions"><Link to="/products" className="button-secondary">Batal</Link><button className="button-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Menyimpan…</> : <><Check size={17} /> Simpan produk</>}</button></div>
    </form>
  </main>;
}
