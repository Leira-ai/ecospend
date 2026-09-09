"use client";

import type { AuthError } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Info, LoaderCircle } from "lucide-react";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { createOptionalBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register" | "forgot" | "reset";
type AuthFormProps = { mode: AuthMode };
type Feedback = { tone: "error" | "success" | "unavailable"; message: string };

const modeCopy = {
  login: { submit: "Masuk ke EcoSpend", alternate: "Belum punya akun?", alternateLink: "/register", alternateLabel: "Daftar gratis" },
  register: { submit: "Buat akun", alternate: "Sudah punya akun?", alternateLink: "/login", alternateLabel: "Masuk" },
  forgot: { submit: "Kirim tautan pemulihan", alternate: "Ingat kata sandi?", alternateLink: "/login", alternateLabel: "Kembali masuk" },
  reset: { submit: "Simpan kata sandi baru", alternate: "Kembali ke", alternateLink: "/login", alternateLabel: "halaman masuk" },
} as const;

const callbackMessages: Record<string, string> = {
  auth_required: "Silakan masuk untuk membuka dasbor, atau gunakan mode demo.",
  callback_invalid: "Tautan autentikasi tidak valid atau sudah tidak lengkap.",
  callback_failed: "Tautan autentikasi tidak dapat diproses. Silakan minta tautan baru.",
  config_missing: "Layanan akun belum dikonfigurasi. Anda tetap dapat membuka dasbor demo.",
};

function subscribeToLocation(): () => void {
  return () => undefined;
}

function getCallbackMessage(): string {
  if (typeof window === "undefined") return "";
  const parameters = new URL(window.location.href).searchParams;
  const code = parameters.get("auth_error") ?? (parameters.has("auth_required") ? "auth_required" : null);
  return code ? callbackMessages[code] ?? "" : "";
}

function authErrorMessage(error: AuthError, mode: AuthMode): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email atau kata sandi tidak cocok.";
    case "email_not_confirmed":
      return "Email belum dikonfirmasi. Periksa kotak masuk Anda.";
    case "weak_password":
      return "Kata sandi belum memenuhi persyaratan keamanan.";
    case "over_email_send_rate_limit":
      return "Terlalu banyak permintaan email. Tunggu sebentar lalu coba lagi.";
    case "same_password":
      return "Kata sandi baru harus berbeda dari kata sandi sebelumnya.";
    case "session_not_found":
      return "Sesi pemulihan tidak ditemukan. Buka kembali tautan dari email terbaru.";
    default:
      return mode === "forgot"
        ? "Permintaan pemulihan belum dapat diproses. Coba lagi beberapa saat lagi."
        : "Permintaan autentikasi belum dapat diproses. Silakan coba lagi.";
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const copy = modeCopy[mode];
  const router = useRouter();
  const callbackMessage = useSyncExternalStore(subscribeToLocation, getCallbackMessage, () => "");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const hasPassword = mode === "login" || mode === "register" || mode === "reset";
  const hasEmail = mode !== "reset";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const result = createOptionalBrowserClient();
    if (!result.configured) {
      setFeedback({ tone: "unavailable", message: result.message });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await result.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        return;
      }

      if (mode === "register") {
        const emailRedirectTo = new URL("/auth/callback?next=/dashboard", window.location.origin).toString();
        const { data, error } = await result.client.auth.signUp({ email, password, options: { emailRedirectTo } });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
          return;
        }
        setFeedback({ tone: "success", message: "Pendaftaran berhasil. Periksa email Anda untuk mengonfirmasi akun." });
      }

      if (mode === "forgot") {
        const redirectTo = new URL("/auth/callback?next=/reset-password", window.location.origin).toString();
        const { error } = await result.client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setFeedback({ tone: "success", message: "Jika email terdaftar, tautan pemulihan telah dikirim. Periksa kotak masuk dan folder spam." });
      }

      if (mode === "reset") {
        const { error } = await result.client.auth.updateUser({ password });
        if (error) throw error;
        setFeedback({ tone: "success", message: "Kata sandi berhasil diperbarui. Anda akan diarahkan ke dasbor." });
        window.setTimeout(() => router.push("/dashboard"), 900);
      }
    } catch (error) {
      const message = error instanceof Error && "code" in error
        ? authErrorMessage(error as AuthError, mode)
        : "Terjadi kendala jaringan. Periksa koneksi Anda lalu coba lagi.";
      setFeedback({ tone: "error", message });
    } finally {
      setIsLoading(false);
    }
  }

  const visibleFeedback = feedback ?? (callbackMessage ? { tone: "error" as const, message: callbackMessage } : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={visibleFeedback ? "auth-status" : undefined}>
      {hasEmail && (
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-800">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="nama@contoh.id" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 motion-reduce:transition-none" />
        </div>
      )}
      {hasPassword && (
        <div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-sm font-semibold text-slate-800">{mode === "reset" ? "Kata sandi baru" : "Kata sandi"}</label>
            {mode === "login" && <Link href="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Lupa kata sandi?</Link>}
          </div>
          <div className="relative mt-2">
            <input id="password" name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 motion-reduce:transition-none" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-emerald-800">
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {mode !== "login" && <p className="mt-2 text-xs leading-5 text-slate-500">Gunakan minimal 8 karakter dan hindari kata sandi yang dipakai di layanan lain.</p>}
        </div>
      )}
      {mode === "register" && (
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input type="checkbox" required className="mt-1 size-4 accent-emerald-700" />
          <span>Saya menyetujui <Link href="/terms" className="font-semibold text-emerald-700 underline-offset-4 hover:underline">syarat penggunaan</Link> dan telah membaca <Link href="/privacy" className="font-semibold text-emerald-700 underline-offset-4 hover:underline">kebijakan privasi</Link>.</span>
        </label>
      )}
      <button type="submit" disabled={isLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none">
        {isLoading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}{copy.submit}
      </button>
      {visibleFeedback && (
        <div id="auth-status" role={visibleFeedback.tone === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm leading-6 ${visibleFeedback.tone === "success" ? "border-emerald-900/15 bg-emerald-50 text-emerald-950/80" : visibleFeedback.tone === "error" ? "border-red-900/15 bg-red-50 text-red-950/80" : "border-amber-900/15 bg-amber-50 text-amber-950/80"}`}>
          <p className="flex items-start gap-2">
            {visibleFeedback.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            <span>{visibleFeedback.message}</span>
          </p>
          {visibleFeedback.tone === "unavailable" && <Link href="/dashboard?demo=1" className="mt-3 inline-flex font-semibold text-emerald-800 hover:underline">Buka dasbor demo</Link>}
        </div>
      )}
      <p className="text-center text-sm text-slate-600">{copy.alternate} <Link href={copy.alternateLink} className="font-semibold text-emerald-700 hover:text-emerald-900">{copy.alternateLabel}</Link></p>
    </form>
  );
}
