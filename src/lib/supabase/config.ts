export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseConfigResult =
  | { configured: true; config: SupabasePublicConfig }
  | { configured: false; message: string };

const missingConfigMessage =
  "Layanan akun belum dikonfigurasi. Anda tetap dapat membuka dasbor demo.";

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isLoopback = url.hostname === "localhost"
      || url.hostname === "127.0.0.1"
      || url.hostname === "[::1]";
    return url.protocol === "https:" || (url.protocol === "http:" && isLoopback);
  } catch {
    return false;
  }
}

export function getSupabasePublicConfig(): SupabaseConfigResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || !isValidSupabaseUrl(url)) {
    return { configured: false, message: missingConfigMessage };
  }

  return { configured: true, config: { url, anonKey } };
}
