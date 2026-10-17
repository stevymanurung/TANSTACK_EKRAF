import { ImagePlus, Link2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_IMAGE_DATA_LENGTH = 300_000;

export function ProductImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function validateImageUrl(url: string) {
    if (!url || url.startsWith("data:image/")) return;
    setError("");
    let parsed: URL;
    try { parsed = new URL(url); } catch { setError("Masukkan URL gambar yang valid."); return; }
    if (parsed.protocol !== "https:") { setError("URL gambar harus menggunakan HTTPS."); return; }
    await new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth > 512 || image.naturalHeight > 512) {
          setError("Ukuran gambar dari URL tidak boleh melebihi 512 × 512 px. Unggah gambar agar otomatis dioptimalkan.");
          onChange("");
        } else if (!image.naturalWidth || !image.naturalHeight) {
          setError("URL tersebut tidak memuat gambar yang valid.");
          onChange("");
        }
        resolve();
      };
      image.onerror = () => { setError("Gambar tidak dapat dimuat dari URL ini. Periksa tautannya atau unggah file gambar."); onChange(""); resolve(); };
      image.src = url;
    });
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar, seperti PNG, JPG, atau WebP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Ukuran file awal maksimal 12 MB.");
      return;
    }
    setProcessing(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser tidak dapat memproses gambar ini.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let quality = 0.82;
      let dataUrl = canvas.toDataURL("image/webp", quality);
      while (dataUrl.length > MAX_IMAGE_DATA_LENGTH && quality > 0.35) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/webp", quality);
      }
      if (dataUrl.length > MAX_IMAGE_DATA_LENGTH) {
        throw new Error("Gambar masih terlalu besar setelah dioptimalkan. Coba gambar yang lebih sederhana.");
      }
      onChange(dataUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memproses gambar.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="button-secondary" onClick={() => fileInput.current?.click()} disabled={processing}>
          <Upload size={16} /> {processing ? "Mengoptimalkan…" : "Unggah gambar"}
        </button>
        {value && <button type="button" className="button-ghost" onClick={() => onChange("")}><X size={16} /> Hapus gambar</button>}
        <input ref={fileInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </div>
      <label className="field-label" htmlFor="imageUrl"><Link2 size={14} /> atau masukkan URL gambar HTTPS</label>
      <input id="imageUrl" className="field-input" type="url" value={value.startsWith("data:image/") ? "" : value} onChange={(event) => { setError(""); onChange(event.target.value); }} onBlur={(event) => void validateImageUrl(event.currentTarget.value)} placeholder="https://contoh.com/produk.jpg" />
      {value && <div className="image-preview"><img src={value} alt="Pratinjau gambar produk" /><span>Pratinjau produk</span></div>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="field-help"><ImagePlus size={14} /> Gambar otomatis diperkecil maksimal 512 px dan dioptimalkan sebelum disimpan.</p>
    </div>
  );
}
