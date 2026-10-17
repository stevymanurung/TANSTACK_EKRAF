import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ImagePlus, X } from "lucide-react";
import { useState } from "react";

import type { Product } from "@/lib/db";
import { createProduct, updateProduct } from "@/lib/server/products";
import { ProductImageInput } from "@/components/products/ProductImageInput";

export function ProductFormModal({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createProduct);
  const updateFn = useServerFn(updateProduct);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const data = { name: name.trim(), description: description.trim(), price: Number(price), stock: Number(stock), imageUrl };
      if (product) await updateFn({ data: { id: product.id, ...data } });
      else await createFn({ data });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Produk gagal disimpan. Periksa kembali data yang dimasukkan.");
    } finally { setSaving(false); }
  }

  return <div className="modal-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape" && !saving) onClose(); }} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="app-modal product-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <header className="app-modal-header"><span className="modal-icon"><ImagePlus size={20} /></span><div><h2 id="product-modal-title">{product ? "Edit produk" : "Tambah produk"}</h2><p>{product ? "Perbarui informasi katalog produk." : "Lengkapi informasi untuk produk baru."}</p></div><button className="modal-close" type="button" onClick={onClose} disabled={saving} aria-label="Tutup modal"><X size={19} /></button></header>
      <form onSubmit={submit} className="app-modal-form">
        <div className="modal-form-scroll"><div className="modal-field-grid">
          <label className="field-group modal-field-span"><span>Nama produk <b>*</b></span><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required autoFocus placeholder="Contoh: Paket Branding Premium" /></label>
          <label className="field-group modal-field-span"><span>Deskripsi <b>*</b></span><textarea className="field-input field-textarea" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} required rows={3} placeholder="Jelaskan detail dan manfaat produk…" /></label>
          <div className="modal-field-span"><span className="modal-field-label">Foto produk</span><ProductImageInput value={imageUrl} onChange={setImageUrl} /></div>
          <label className="field-group"><span>Harga (Rupiah) <b>*</b></span><div className="money-input"><span>Rp</span><input className="field-input" type="number" min="0" max="1000000000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></div></label>
          <label className="field-group"><span>Stok <b>*</b></span><input className="field-input" type="number" min="0" max="1000000" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required /></label>
        </div>{error && <div className="form-error" role="alert">{error}</div>}</div>
        <footer className="app-modal-actions"><button className="button-secondary" type="button" onClick={onClose} disabled={saving}>Batal</button><button className="button-primary" type="submit" disabled={saving}>{saving ? <><span className="spinner" /> Menyimpan…</> : <><Check size={16} /> {product ? "Simpan perubahan" : "Simpan produk"}</>}</button></footer>
      </form>
    </section>
  </div>;
}
