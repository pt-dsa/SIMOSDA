import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Inventory } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { QrCode, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DetailModal } from '@/components/ui/DetailModal';
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

export default function Inventaris() {
  const [data, setData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterRuangan, setFilterRuangan] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");

  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await spreadsheetService.getInventory();
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchRuangan = filterRuangan ? String(item.lokasi_ruangan || "").toLowerCase() === String(filterRuangan || "").toLowerCase() : true;
      const matchKondisi = filterKondisi ? String(item.kondisi || "").toLowerCase() === String(filterKondisi || "").toLowerCase() : true;
      return matchRuangan && matchKondisi;
    });
  }, [data, filterRuangan, filterKondisi]);

  const uniqueRuangan = Array.from(new Set(data.map(d => d.lokasi_ruangan).filter(Boolean)));
  const uniqueKondisi = Array.from(new Set(data.map(d => d.kondisi).filter(Boolean)));

  const columns: ColumnDef<Inventory>[] = [
    {
      header: "Nama Barang",
      accessorKey: "nama_aset",
      sortable: true,
      cell: (row) => <span className="font-semibold">{row.nama_aset}</span>,
    },
    {
      header: "Merk",
      accessorKey: "merk",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.merk}</div>
          <div className="text-xs text-gray-500">{row.tahun ? `Tahun: ${row.tahun}` : ""}</div>
        </div>
      ),
    },
    {
      header: "Lokasi Ruangan",
      accessorKey: "lokasi_ruangan",
      sortable: true,
    },
    {
      header: "Jumlah",
      accessorKey: "jumlah",
      sortable: true,
      cell: (row) => <span>{row.jumlah} {row.satuan}</span>
    },
    {
      header: "Kondisi",
      accessorKey: "kondisi",
      sortable: true,
      cell: (row) => (
        <StatusBadge status={row.kondisi || ""} />
      ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.latitude && row.longitude && (
            <a 
              href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
              target="_blank" rel="noreferrer"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
              title="Buka di Maps"
            >
              <MapPin size={16} />
            </a>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedQR((row as any).id_aset || (row as any).id || JSON.stringify(row)); }}
            className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
            title="Generate QR Code"
          >
            <QrCode size={16} />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: Inventory) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{row.nama_aset}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.merk} {row.tahun ? `(${row.tahun})` : ""}</div>
        </div>
        <StatusBadge status={row.kondisi || ""} />
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Lokasi</span>
          {row.lokasi_ruangan || "-"}
        </div>
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Jumlah</span>
          {row.jumlah} {row.satuan}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 justify-end">
        {row.latitude && row.longitude && (
          <a 
            href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
            target="_blank" rel="noreferrer"
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
            title="Buka di Maps"
          >
            <MapPin size={16} />
          </a>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedQR((row as any).id_aset || (row as any).id || JSON.stringify(row)); }}
          className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
          title="Generate QR Code"
        >
          <QrCode size={16} />
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Inventaris Ruangan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen daftar inventaris berbagai ruangan/bidang</p>
        </div>
        <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
          Total: {filteredData.length} Barang
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput 
            placeholder="Cari nama barang, merk..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterRuangan}
            onChange={(e) => setFilterRuangan(e.target.value)}
          >
            <option value="">Semua Lokasi Ruangan</option>
            {uniqueRuangan.map((j: any) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select 
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value)}
          >
            <option value="">Semua Kondisi</option>
            {uniqueKondisi.map((k: any) => <option key={k} value={k}>{k}</option>)}
          </select>
        </CardContent>
      </Card>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        searchQuery={search}
        renderMobileCard={renderMobileCard}
        onRowClick={(row) => setSelectedItem(row)} 
      />

      <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detail Informasi" data={selectedItem} />

      {/* Basic QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedQR(null)}>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-sm w-full mx-4 flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">QR Code Aset</h3>
            <div className="p-4 bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset]">
              <QRCodeSVG value={selectedQR} size={200} />
            </div>
            <button 
              onClick={() => setSelectedQR(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
