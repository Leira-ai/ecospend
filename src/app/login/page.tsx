import type { Metadata } from "next";
import { AuthForm } from "@/components/public/auth-form";
import { AuthShell } from "@/components/public/auth-shell";

export const metadata: Metadata = { title: "Masuk | EcoSpend", description: "Masuk ke akun EcoSpend Anda." };

export default function LoginPage() {
  return <AuthShell eyebrow="Selamat datang kembali" title="Masuk ke akun Anda" description="Lanjutkan memahami arus uang dan dampak di balik pilihan sehari-hari."><AuthForm mode="login" /></AuthShell>;
}
