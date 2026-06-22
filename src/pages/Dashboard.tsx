import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { spreadsheetService } from "@/services/spreadsheetService";
import { DashboardMetrics } from "@/types";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { CarFront, Wrench, Package, ArrowRightLeft, ShieldCheck, Wallet, Banknote, Archive, Settings } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { motion } from "motion/react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setErrorMsg(null);
        const data = await spreadsheetService.getDashboardMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Gagal memuat data dari Spreadsheet.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md text-center border border-red-200">
          <ShieldCheck size={48} className="mx-auto mb-4 text-red-500 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm">{errorMsg}</p>
          <p className="text-xs mt-4 text-red-400">Silakan periksa Spreadsheet ID dan pastikan URL dibagikan ke publik ("Anyone with the link can view").</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const KpiCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {typeof value === 'number' && title.includes("Pagu") ? formatCurrency(value) : 
             typeof value === 'number' && title.includes("Realisasi") ? formatCurrency(value) :
             formatNumber(value)}
          </h4>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const pieData = [
    { name: "Kendaraan", value: metrics.totalKendaraan, color: "#0B57D0" },
    { name: "Alat & Mesin", value: metrics.totalAlatMesin, color: "#34A853" },
    { name: "Inventaris", value: metrics.totalInventaris, color: "#FBBC04" },
  ];

  const barData = [
    { name: "Anggaran", Pagu: metrics.totalPagu, Realisasi: metrics.totalRealisasi }
  ];

  const formattedLastUpdated = metrics?.lastUpdated
    ? new Intl.DateTimeFormat("id-ID", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      }).format(new Date(metrics.lastUpdated))
    : "Data real-time";

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan statistik aset daerah saat ini</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Terakhir sinkronisasi: {formattedLastUpdated}
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total Aset" value={metrics.totalAset} icon={Package} colorClass="bg-blue-100/50 text-blue-600" />
        <KpiCard title="Kendaraan" value={metrics.totalKendaraan} icon={CarFront} colorClass="bg-indigo-100/50 text-indigo-600" />
        <KpiCard title="Alat & Mesin" value={metrics.totalAlatMesin} icon={Wrench} colorClass="bg-green-100/50 text-green-600" />
        <KpiCard title="Inventaris" value={metrics.totalInventaris} icon={Archive} colorClass="bg-yellow-100/50 text-yellow-600" />
        <KpiCard title="Peminjaman" value={metrics.totalPeminjaman} icon={ArrowRightLeft} colorClass="bg-amber-100/50 text-amber-600" />
        <KpiCard title="Pemeliharaan" value={metrics.totalPemeliharaan} icon={Settings} colorClass="bg-red-100/50 text-red-600" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard title="Total Pagu" value={metrics.totalPagu} icon={Wallet} colorClass="bg-slate-100/50 text-slate-600" />
          <KpiCard title="Total Realisasi" value={metrics.totalRealisasi} icon={Banknote} colorClass="bg-emerald-100/50 text-emerald-600" subtitle={`${metrics.persenRealisasi.toFixed(1)}% terserap`} />
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Pagu dan Realisasi Anggaran</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E3E3E3" />
                  <XAxis type="number" tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)} Jt`} tickMargin={10} />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={false} />
                  <Bar dataKey="Pagu" fill="#0B57D0" radius={[0, 4, 4, 0]} barSize={32} />
                  <Bar dataKey="Realisasi" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Distribusi Kategori Aset</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-0 pb-6">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full px-6 space-y-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {metrics.assetTrends && metrics.assetTrends.length > 0 && (
        <motion.div variants={itemVariants} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tren Pengadaan Aset (5 Tahun Terakhir)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.assetTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E3E3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                  <Tooltip cursor={false} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Line type="monotone" name="Kendaraan" dataKey="Vehicles" stroke="#0B57D0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Alat & Mesin" dataKey="Equipment" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Inventaris" dataKey="Inventory" stroke="#D97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Estimasi Kebutuhan Biaya Pemeliharaan (6 Bulan ke Depan)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1">
                <p className="text-sm text-gray-500">Estimasi total biaya pemeliharaan untuk 6 bulan ke depan:</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.maintenanceForecast ? formatCurrency(metrics.maintenanceForecast.sixMonthTotal) : "Rp 0"}
                </p>
                <p className="text-xs text-gray-400">Atau rata-rata {metrics.maintenanceForecast ? formatCurrency(metrics.maintenanceForecast.avgMonthlyCost) : "Rp 0"} per bulan berdasarkan riwayat data.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.maintenanceForecast?.forecastData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E3E3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} tickMargin={10} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)} Jt`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={false} />
                    <Bar name="Estimasi Biaya" dataKey="PredictedCost" fill="#0B57D0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}
