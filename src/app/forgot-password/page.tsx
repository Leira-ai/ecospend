import type { Metadata } from "next";
import { AuthForm } from "@/components/public/auth-form";
import { AuthShell } from "@/components/public/auth-shell";

export const metadata: Metadata = { title: "Lupa kata sandi | EcoSpend", description: "Minta tautan pemulihan akun EcoSpend." };

export default function ForgotPasswordPage() {
  return <AuthShell eyebrow="Pemulihan akun" title="Atur ulang kata sandi" description="Masukkan email akun Anda. Jika terdaftar, instruksi pemulihan akan dikirim tanpa mengungkap status akun."><AuthForm mode="forgot" /></AuthShell>;
}
