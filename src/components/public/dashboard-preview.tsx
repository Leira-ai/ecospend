import { ArrowDownRight, ArrowUpRight, Bike, Bus, Coffee, Leaf, ShoppingBag, Sparkles, Utensils } from "lucide-react";

const bars = [35, 52, 44, 68, 58, 78, 64];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none" aria-label="Pratinjau dasbor EcoSpend dengan data contoh">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-300/30 via-transparent to-lime-200/30 blur-2xl" aria-hidden="true" />
      <div className="overflow-hidden rounded-[1.75rem] border border-emerald-950/10 bg-white p-3 shadow-[0_36px_70px_-36px_rgb(2_44_34/0.5)] ring-1 ring-white/60 sm:p-4">
        <div className="flex items-center justify-between px-2 pb-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-700 text-white"><Leaf className="size-4" aria-hidden="true" /></span>
            <span className="text-xs font-bold tracking-tight text-emerald-950">EcoSpend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 sm:inline">September 2026</span>
            <span className="grid size-7 place-items-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-800">AL</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f4f7f1] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Sisa anggaran" value="Rp3,8 jt" trend="+8%" positive />
            <Metric label="Pengeluaran" value="Rp4,2 jt" trend="-5%" positive />
            <div className="col-span-2 sm:col-span-1"><Metric label="Perkiraan emisi" value="86,4 kg" trend="-12%" positive /></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-xl border border-emerald-950/5 bg-white p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-medium text-slate-500">Tren pengeluaran</p><p className="mt-1 text-xs font-semibold text-slate-900">7 hari terakhir</p></div>
                <span className="text-[10px] font-semibold text-emerald-700">Lebih hemat</span>
              </div>
              <div className="mt-6 flex h-24 items-end gap-2" aria-hidden="true">
                {bars.map((bar, index) => (
                  <div key={index} className="flex h-full flex-1 items-end rounded-t-md bg-emerald-50">
                    <div className={`w-full rounded-t-md ${index === 5 ? "bg-lime-400" : "bg-emerald-700"}`} style={{ height: `${bar}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[8px] text-slate-600"><span>Sen</span><span>Rab</span><span>Jum</span><span>Min</span></div>
            </div>
            <div className="rounded-xl bg-emerald-950 p-4 text-white">
              <div className="flex items-center justify-between"><p className="text-[10px] text-emerald-100/70">Jejak bulan ini</p><Sparkles className="size-3.5 text-lime-300" aria-hidden="true" /></div>
              <div className="mx-auto mt-4 grid size-24 place-items-center rounded-full border-[9px] border-emerald-700/60 border-t-lime-300">
                <div className="text-center"><p className="text-xl font-bold">86,4</p><p className="text-[9px] text-emerald-100/60">kg CO₂e*</p></div>
              </div>
              <p className="mt-3 text-center text-[9px] leading-4 text-emerald-100/70">12% lebih rendah dari bulan lalu</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-emerald-950/5 bg-white p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Transaksi terbaru</p><span className="text-[9px] font-medium text-emerald-700">Lihat semua</span></div>
            <div className="mt-3 divide-y divide-slate-100">
              <Transaction icon={Coffee} name="Kopi Nusantara" category="Makan & minum" amount="−Rp42.000" carbon="0,8 kg*" />
              <Transaction icon={Bus} name="Bus kota" category="Transportasi" amount="−Rp15.000" carbon="0,3 kg*" />
              <Transaction icon={ShoppingBag} name="Pasar Minggu" category="Belanja" amount="−Rp185.000" carbon="2,1 kg*" />
            </div>
          </div>
        </div>
      </div>
      <div className="animate-drift absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex lg:-left-8">
        <span className="grid size-9 place-items-center rounded-xl bg-lime-100 text-emerald-800"><Bike className="size-4" aria-hidden="true" /></span>
        <div><p className="text-[10px] text-slate-500">Pilihan rendah karbon</p><p className="text-xs font-bold text-emerald-950">3 perjalanan minggu ini</p></div>
      </div>
    </div>
  );
}

type MetricProps = { label: string; value: string; trend: string; positive?: boolean };
function Metric({ label, value, trend, positive }: MetricProps) {
  const TrendIcon = positive ? ArrowDownRight : ArrowUpRight;
  return <div className="rounded-xl border border-emerald-950/5 bg-white p-3"><p className="text-[9px] text-slate-500 sm:text-[10px]">{label}</p><div className="mt-2 flex items-end justify-between gap-2"><p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{value}</p><span className="inline-flex items-center text-[9px] font-semibold text-emerald-700"><TrendIcon className="size-3" aria-hidden="true" />{trend}</span></div></div>;
}

type IconType = typeof Utensils;
type TransactionProps = { icon: IconType; name: string; category: string; amount: string; carbon: string };
function Transaction({ icon: Icon, name, category, amount, carbon }: TransactionProps) {
  return <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5"><span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="size-3.5" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold text-slate-800 sm:text-xs">{name}</p><p className="text-[8px] text-slate-600 sm:text-[9px]">{category}</p></div><div className="text-right"><p className="text-[10px] font-semibold text-slate-800 sm:text-xs">{amount}</p><p className="text-[8px] text-emerald-700 sm:text-[9px]">{carbon}</p></div></div>;
}
