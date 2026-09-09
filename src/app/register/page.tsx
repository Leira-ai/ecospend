import type { Metadata } from "next";
import { AuthForm } from "@/components/public/auth-form";
import { AuthShell } from "@/components/public/auth-shell";

export const metadata: Metadata = { title: "Daftar | EcoSpend", description: "Buat akun EcoSpend dan mulai kelola keuangan dengan lebih sadar." };

export default function RegisterPage() {
  return <AuthShell eyebrow="Mulai dengan tenang" title="Buat akun EcoSpend" description="Bangun kebiasaan finansial yang lebih terarah, satu catatan pada satu waktu."><AuthForm mode="register" /></AuthShell>;
}
