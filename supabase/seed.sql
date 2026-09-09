begin;

-- Stable UUIDs make the seed idempotent and safe to reference from application fixtures.
insert into public.categories (id,user_id,name,slug,kind,parent_id,icon,color,is_system,sort_order) values
('10000000-0000-4000-8000-000000000001',null,'Makanan & Minuman','makanan-minuman','expense',null,'utensils','#F59E0B',true,10),
('10000000-0000-4000-8000-000000000002',null,'Belanja Bahan Makanan','belanja-bahan-makanan','expense','10000000-0000-4000-8000-000000000001','shopping-basket','#F59E0B',true,11),
('10000000-0000-4000-8000-000000000003',null,'Restoran & Kafe','restoran-kafe','expense','10000000-0000-4000-8000-000000000001','coffee','#F59E0B',true,12),
('10000000-0000-4000-8000-000000000004',null,'Transportasi','transportasi','expense',null,'bus','#3B82F6',true,20),
('10000000-0000-4000-8000-000000000005',null,'Transportasi Umum','transportasi-umum','expense','10000000-0000-4000-8000-000000000004','train','#3B82F6',true,21),
('10000000-0000-4000-8000-000000000006',null,'Bahan Bakar','bahan-bakar','expense','10000000-0000-4000-8000-000000000004','fuel','#3B82F6',true,22),
('10000000-0000-4000-8000-000000000007',null,'Ojek & Taksi','ojek-taksi','expense','10000000-0000-4000-8000-000000000004','car-taxi-front','#3B82F6',true,23),
('10000000-0000-4000-8000-000000000008',null,'Tempat Tinggal','tempat-tinggal','expense',null,'house','#8B5CF6',true,30),
('10000000-0000-4000-8000-000000000009',null,'Sewa & Cicilan Rumah','sewa-cicilan-rumah','expense','10000000-0000-4000-8000-000000000008','key','#8B5CF6',true,31),
('10000000-0000-4000-8000-000000000010',null,'Utilitas','utilitas','expense','10000000-0000-4000-8000-000000000008','plug','#8B5CF6',true,32),
('10000000-0000-4000-8000-000000000011',null,'Kesehatan','kesehatan','expense',null,'heart-pulse','#EF4444',true,40),
('10000000-0000-4000-8000-000000000012',null,'Pendidikan','pendidikan','expense',null,'graduation-cap','#06B6D4',true,50),
('10000000-0000-4000-8000-000000000013',null,'Belanja','belanja','expense',null,'shopping-bag','#EC4899',true,60),
('10000000-0000-4000-8000-000000000014',null,'Hiburan','hiburan','expense',null,'film','#A855F7',true,70),
('10000000-0000-4000-8000-000000000015',null,'Perawatan Pribadi','perawatan-pribadi','expense',null,'sparkles','#F472B6',true,80),
('10000000-0000-4000-8000-000000000016',null,'Sosial & Donasi','sosial-donasi','expense',null,'hand-heart','#14B8A6',true,90),
('10000000-0000-4000-8000-000000000017',null,'Pajak & Biaya','pajak-biaya','expense',null,'receipt','#64748B',true,100),
('10000000-0000-4000-8000-000000000018',null,'Pengeluaran Lainnya','pengeluaran-lainnya','expense',null,'circle-ellipsis','#78716C',true,110),
('10000000-0000-4000-8000-000000000019',null,'Gaji','gaji','income',null,'wallet-cards','#22C55E',true,200),
('10000000-0000-4000-8000-000000000020',null,'Bonus & Tunjangan','bonus-tunjangan','income',null,'gift','#22C55E',true,210),
('10000000-0000-4000-8000-000000000021',null,'Pendapatan Usaha','pendapatan-usaha','income',null,'store','#16A34A',true,220),
('10000000-0000-4000-8000-000000000022',null,'Investasi','investasi','income',null,'chart-no-axes-combined','#15803D',true,230),
('10000000-0000-4000-8000-000000000023',null,'Hadiah & Pengembalian','hadiah-pengembalian','income',null,'badge-dollar-sign','#4ADE80',true,240),
('10000000-0000-4000-8000-000000000024',null,'Pendapatan Lainnya','pendapatan-lainnya','income',null,'circle-plus','#65A30D',true,250)
on conflict (id) do nothing;

-- DEMONSTRATION ONLY: synthetic values for UI/testing, not accounting or sustainability claims.
insert into public.emission_factors (
  id,factor_key,version,name,description,activity_unit,kg_co2e_per_unit,region_code,valid_from,source_name,source_url,
  source_published_on,methodology,metadata,is_demo,is_active
) values
('20000000-0000-4000-8000-000000000001','demo.id.electricity-grid',1,'DEMO — Listrik jaringan Indonesia',
 'Nilai sintetis untuk demonstrasi alur perhitungan; jangan digunakan untuk pelaporan emisi.','kWh',0.850000000,'ID','2026-01-01',
 'EcoSpend demonstration dataset',null,'2026-01-01','Aktivitas × faktor emisi sintetis.',
 '{"label":"DEMONSTRATION ONLY","provenance":"synthetic","warning":"Not for reporting or decision-making","scope":"location-based demo"}'::jsonb,true,true),
('20000000-0000-4000-8000-000000000002','demo.id.petrol',1,'DEMO — Bensin',
 'Nilai sintetis untuk demonstrasi konsumsi bahan bakar; bukan faktor resmi.','liter',2.300000000,'ID','2026-01-01',
 'EcoSpend demonstration dataset',null,'2026-01-01','Liter bahan bakar × faktor emisi sintetis.',
 '{"label":"DEMONSTRATION ONLY","provenance":"synthetic","warning":"Not for reporting or decision-making","assumption":"direct combustion demo"}'::jsonb,true,true),
('20000000-0000-4000-8000-000000000003','demo.id.motorcycle',1,'DEMO — Sepeda motor',
 'Nilai sintetis per kilometer penumpang untuk demonstrasi.','passenger_km',0.080000000,'ID','2026-01-01',
 'EcoSpend demonstration dataset',null,'2026-01-01','Jarak penumpang × faktor emisi sintetis.',
 '{"label":"DEMONSTRATION ONLY","provenance":"synthetic","warning":"Not for reporting or decision-making","mode":"motorcycle"}'::jsonb,true,true),
('20000000-0000-4000-8000-000000000004','demo.id.city-bus',1,'DEMO — Bus kota',
 'Nilai sintetis per kilometer penumpang untuk demonstrasi.','passenger_km',0.060000000,'ID','2026-01-01',
 'EcoSpend demonstration dataset',null,'2026-01-01','Jarak penumpang × faktor emisi sintetis.',
 '{"label":"DEMONSTRATION ONLY","provenance":"synthetic","warning":"Not for reporting or decision-making","mode":"city_bus"}'::jsonb,true,true),
('20000000-0000-4000-8000-000000000005','demo.id.domestic-flight',1,'DEMO — Penerbangan domestik',
 'Nilai sintetis per kilometer penumpang untuk demonstrasi.','passenger_km',0.160000000,'ID','2026-01-01',
 'EcoSpend demonstration dataset',null,'2026-01-01','Jarak penumpang × faktor emisi sintetis.',
 '{"label":"DEMONSTRATION ONLY","provenance":"synthetic","warning":"Not for reporting or decision-making","mode":"domestic_flight"}'::jsonb,true,true)
on conflict (factor_key,version) do nothing;

commit;
