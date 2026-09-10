"use client";

import { Download, LoaderCircle, Paperclip, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ConfirmDialog, buttonPrimary, buttonSecondary, cardClass } from "./ui";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

type Attachment = {
  id: string;
  transaction_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number | string;
  created_at: string;
};

type ApiEnvelope<T> = { data?: T; error?: { message?: string } };

export function AttachmentManager({ transactionId, transactionName }: { transactionId: string; transactionName: string }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/attachments?transactionId=${encodeURIComponent(transactionId)}`, {
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async (response) => {
      const body = await parseResponse<Attachment[]>(response);
      if (!response.ok) throw new Error(errorMessage(body, "Lampiran tidak dapat dimuat"));
      setAttachments(body.data ?? []);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Lampiran tidak dapat dimuat");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [transactionId]);

  const selectFile = (file: File | null) => {
    setError(null); setNotice(null);
    if (!file) { setSelectedFile(null); return; }
    if (!ALLOWED_TYPES.has(file.type)) { setSelectedFile(null); setError("Pilih file JPEG, PNG, WebP, atau PDF."); return; }
    if (file.size < 1) { setSelectedFile(null); setError("File kosong tidak dapat diunggah."); return; }
    if (file.size > MAX_BYTES) { setSelectedFile(null); setError("Ukuran file melebihi batas 10 MiB."); return; }
    setSelectedFile(file);
  };

  const upload = async () => {
    if (!selectedFile || busy) return;
    setBusy("upload"); setError(null); setNotice(null);
    const form = new FormData(); form.set("transactionId", transactionId); form.set("file", selectedFile);
    try {
      const response = await fetch("/api/attachments", { method: "POST", body: form });
      const body = await parseResponse<Attachment>(response);
      if (!response.ok || !body.data) throw new Error(errorMessage(body, "Lampiran gagal diunggah"));
      setAttachments((current) => [body.data as Attachment, ...current]);
      setSelectedFile(null); if (inputRef.current) inputRef.current.value = "";
      setNotice("Lampiran berhasil diunggah.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Lampiran gagal diunggah"); }
    finally { setBusy(null); }
  };

  const download = async (attachment: Attachment) => {
    if (busy) return;
    setBusy(attachment.id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/attachments/${encodeURIComponent(attachment.id)}/download`, { method: "POST" });
      const body = await parseResponse<{ url: string }>(response);
      if (!response.ok || !body.data?.url) throw new Error(errorMessage(body, "Tautan unduhan tidak dapat dibuat"));
      const anchor = document.createElement("a"); anchor.href = body.data.url; anchor.download = attachment.original_filename;
      anchor.rel = "noopener noreferrer"; document.body.append(anchor); anchor.click(); anchor.remove();
      setNotice("Unduhan lampiran dimulai.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Lampiran gagal diunduh"); }
    finally { setBusy(null); }
  };

  const remove = async (attachment: Attachment) => {
    if (busy) return;
    setBusy(attachment.id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/attachments/${encodeURIComponent(attachment.id)}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await parseResponse<never>(response);
        throw new Error(errorMessage(body, "Lampiran gagal dihapus"));
      }
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      setNotice("Lampiran berhasil dihapus.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Lampiran gagal dihapus"); }
    finally { setBusy(null); }
  };

  return (
    <section aria-labelledby={`${inputId}-title`} className={`${cardClass} p-4`}>
      <div className="flex items-start gap-3"><Paperclip className="mt-0.5 size-5 text-emerald-700" /><div>
        <h3 id={`${inputId}-title`} className="font-semibold text-slate-900 dark:text-white">Lampiran transaksi</h3>
        <p className="text-xs text-slate-600">{transactionName} · JPEG, PNG, WebP, atau PDF · maksimum 10 MiB</p>
      </div></div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">Pilih lampiran</label>
          <input ref={inputRef} id={inputId} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            className="block min-h-11 w-full rounded-xl border border-slate-300 bg-white text-sm file:mr-3 file:min-h-11 file:border-0 file:bg-emerald-50 file:px-3 file:font-semibold file:text-emerald-800 dark:border-slate-700 dark:bg-slate-950" />
        </div>
        <button type="button" onClick={() => void upload()} disabled={!selectedFile || busy !== null} className={buttonPrimary}>
          {busy === "upload" ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}Unggah
        </button>
      </div>
      {selectedFile && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Dipilih: <strong>{selectedFile.name}</strong> · {displayType(selectedFile.type)} · {formatBytes(selectedFile.size)}</p>}
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">{error && <p role="alert" className="text-rose-700 dark:text-rose-400">{error}</p>}{notice && <p className="text-emerald-700 dark:text-emerald-400">{notice}</p>}</div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        {loading ? <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 animate-spin" />Memuat lampiran...</p>
          : attachments.length === 0 ? <p className="text-sm text-slate-600">Belum ada lampiran untuk transaksi ini.</p>
            : <ul aria-label="Daftar lampiran" className="divide-y divide-slate-100 dark:divide-slate-800">{attachments.map((attachment) => <li key={attachment.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{attachment.original_filename}</p><p className="text-xs text-slate-600">{displayType(attachment.content_type)} · {formatBytes(Number(attachment.size_bytes))}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => void download(attachment)} disabled={busy !== null} className={buttonSecondary} aria-label={`Unduh ${attachment.original_filename}`}><Download className="size-4" />Unduh</button>
                <button type="button" onClick={() => setDeleting(attachment)} disabled={busy !== null} className={`${buttonSecondary} text-rose-700`} aria-label={`Hapus ${attachment.original_filename}`}><Trash2 className="size-4" />Hapus</button></div>
            </li>)}</ul>}
      </div>
      <ConfirmDialog open={deleting !== null} title="Hapus lampiran?" description={deleting ? `${deleting.original_filename} akan dihapus permanen.` : "Lampiran akan dihapus permanen."} confirmLabel="Hapus lampiran" danger onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) void remove(deleting); }} />
    </section>
  );
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  return response.json().catch(() => ({} as ApiEnvelope<T>));
}
function errorMessage(body: ApiEnvelope<unknown>, fallback: string): string { return body.error?.message || fallback; }
function displayType(type: string): string { return ({ "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP", "application/pdf": "PDF" } as Record<string, string>)[type] ?? type; }
function formatBytes(bytes: number): string { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB` : `${Math.max(0, bytes / 1024).toFixed(1)} KiB`; }
