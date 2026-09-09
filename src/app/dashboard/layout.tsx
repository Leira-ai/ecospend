import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/app-shell";

export const metadata: Metadata = {
  title: "Dasbor | EcoSpend",
  description: "Kelola keuangan dan pantau jejak karbon dalam satu tempat.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
