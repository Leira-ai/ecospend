import type { Metadata } from "next";
import { AuthForm } from "@/components/public/auth-form";
import { AuthShell } from "@/components/public/auth-shell";

export const metadata: Metadata = { title: "Kata sandi baru | EcoSpend", description: "Tentukan kata sandi baru untuk akun EcoSpend." };

export default function ResetPasswordPage() {
  return <AuthShell eyebrow="Amankan akun" title="Buat kata sandi baru" description="Pilih kata sandi unik yang belum pernah Anda gunakan di layanan lain."><AuthForm mode="reset" /></AuthShell>;
}
