"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearEcoSpendWorkerCaches } from "@/components/public/pwa-register";
import { createOptionalBrowserClient } from "@/lib/supabase/client";
import { Modal, buttonPrimary, buttonSecondary, inputClass, labelClass } from "./ui";

const CONFIRMATION = "DELETE";
const ECOSPEND_STORAGE_PREFIX = "ecospend-";

function clearEcoSpendStorage(): void {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(ECOSPEND_STORAGE_PREFIX)) storage.removeItem(key);
    }
  }
}

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // The generic message below avoids exposing an unexpected response body.
  }
  return "Akun belum dapat dihapus. Tidak ada data basis data yang dihapus; coba lagi.";
}

export function AccountDeletion() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmation("");
  };

  const deleteAccount = async () => {
    if (deleting || confirmation !== CONFIRMATION) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: CONFIRMATION }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const result = createOptionalBrowserClient();
      if (result.configured) {
        try {
          await result.client.auth.signOut({ scope: "local" });
        } catch {
          // The server already deleted the account; continue removing local data.
        }
      }
      clearEcoSpendStorage();
      try {
        await clearEcoSpendWorkerCaches(true);
      } catch {
        // Continue to a signed-out page even if optional worker cleanup is unavailable.
      }
      toast.success("Akun dan data EcoSpend Anda telah dihapus");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Akun belum dapat dihapus. Coba lagi.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonSecondary} text-rose-700`}>
        <Trash2 className="size-4" />Hapus akun permanen
      </button>
      <Modal
        open={open}
        title="Hapus akun secara permanen"
        description="Tindakan ini tidak dapat dibatalkan. Ekspor data Anda terlebih dahulu bila diperlukan."
        onClose={close}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
            <p className="font-semibold">Data yang akan dihapus</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Profil dan akun keuangan</li>
              <li>Transaksi, kategori, tag, aturan merchant, dan riwayat impor</li>
              <li>Anggaran, target, kontribusi, dan transaksi berulang</li>
              <li>Estimasi karbon, notifikasi, serta lampiran privat</li>
            </ul>
          </div>
          <label htmlFor="account-delete-confirmation">
            <span className={labelClass}>Ketik {CONFIRMATION} untuk mengonfirmasi</span>
            <input
              id="account-delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={deleting}
              placeholder={CONFIRMATION}
              className={inputClass}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} disabled={deleting} className={buttonSecondary}>Batal</button>
            <button
              type="button"
              onClick={() => void deleteAccount()}
              disabled={confirmation !== CONFIRMATION || deleting}
              className={`${buttonPrimary} bg-rose-700 hover:bg-rose-800`}
            >
              {deleting ? "Menghapus akun…" : "Hapus akun permanen"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
