import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, HelpCircle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian Dana — EcoSpend",
  description: "Ketentuan pengembalian dana dan pembatalan langganan EcoSpend Pro.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--background)] px-5 py-12 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e6f4e] hover:underline dark:text-[#8bd3a7]"><ArrowLeft className="size-4" /> Kembali ke harga</Link>
        <div className="mt-8 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="size-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1e6f4e] dark:text-[#8bd3a7]">Kebijakan layanan</p><h1 className="font-display text-3xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">Pengembalian dana EcoSpend</h1></div></div>
        <p className="mt-6 text-sm leading-7 text-[#43544b] dark:text-[#b8c7bd]">Terakhir diperbarui: 12 September 2026. Kami ingin Anda yakin sebelum terus menggunakan EcoSpend Pro.</p>
        <div className="mt-8 space-y-6">
          <section className="eco-paper rounded-2xl p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-[#0e3b2c] dark:text-[#eef5ef]"><CheckCircle2 className="size-5 text-emerald-600" /> Jaminan 14 hari</h2><p className="mt-3 text-sm leading-7 text-[#43544b] dark:text-[#b8c7bd]">Pelanggan Pro dapat meminta pengembalian dana penuh dalam 14 hari kalender sejak pembayaran pertama atau perpanjangan, jika fitur tidak sesuai deskripsi. Hubungi support dengan email akun dan ID pembayaran.</p></section>
          <section className="eco-paper rounded-2xl p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-[#0e3b2c] dark:text-[#eef5ef]"><CreditCard className="size-5 text-emerald-600" /> Pembatalan</h2><p className="mt-3 text-sm leading-7 text-[#43544b] dark:text-[#b8c7bd]">Pembatalan menghentikan perpanjangan otomatis. Akses Pro tetap aktif sampai akhir periode yang sudah dibayar. Pembatalan tidak menghapus transaksi atau akun Anda.</p></section>
          <section className="eco-paper rounded-2xl p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-[#0e3b2c] dark:text-[#eef5ef]"><HelpCircle className="size-5 text-emerald-600" /> Proses dan pengecualian</h2><ul className="mt-3 space-y-2 text-sm leading-7 text-[#43544b] dark:text-[#b8c7bd]"><li>• Permintaan diproses maksimal 7 hari kerja.</li><li>• Pengembalian dilakukan ke metode pembayaran asal.</li><li>• Transaksi yang sama tidak dapat dikembalikan dua kali.</li><li>• Biaya gateway atau pajak yang tidak dapat dikembalikan dapat dipotong sesuai aturan penyedia pembayaran.</li></ul></section>
        </div>
        <p className="mt-8 text-sm text-[#43544b] dark:text-[#b8c7bd]">Butuh bantuan? Hubungi <a className="font-semibold text-[#1e6f4e] underline dark:text-[#8bd3a7]" href="mailto:support@ecospend.local">support@ecospend.local</a>.</p>
      </div>
    </main>
  );
}
