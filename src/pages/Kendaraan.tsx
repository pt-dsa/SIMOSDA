import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { Vehicle } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card, CardContent } from "@/components/ui/Card";
import { QrCode, MapPin, Plus, Edit2, Trash2, X, ImageOff, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { DetailModal } from "@/components/ui/DetailModal";

export default function Kendaraan() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");

  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Vehicle | null>(null);
  
  // CRUD states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  useEffect(() => {
    async function fetch() {
      try {
        const res = await spreadsheetService.getVehicles();
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data kendaraan ini?")) {
      setData(prev => prev.filter(item => item.asset_id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.asset_id) {
      setData(prev => prev.map(item => item.asset_id === formData.asset_id ? { ...item, ...formData } as Vehicle : item));
    } else {
      const newItem = {
        ...formData,
        asset_id: `VEH${Date.now()}`,
      } as Vehicle;
      setData(prev => [newItem, ...prev]);
    }
    setIsEditing(false);
    setFormData({});
  };

  const openForm = (item?: Vehicle) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setIsEditing(true);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchJenis = filterJenis ? String(item.jenis_kendaraan || "").toLowerCase() === String(filterJenis || "").toLowerCase() : true;
      const matchKondisi = filterKondisi ? String(item.kondisi || "").toLowerCase() === String(filterKondisi || "").toLowerCase() : true;
      return matchJenis && matchKondisi;
    });
  }, [data, filterJenis, filterKondisi]);

  const isMaintenanceDue = (kmText: string | number | undefined) => {
    if (!kmText) return false;
    const km = parseInt(String(kmText).replace(/[^0-9]/g, ''), 10);
    if (!km || isNaN(km)) return false;
    // Assume service interval is every 5000 KM. If modulo is >= 4500 or exactly 0, flag it.
    return km % 5000 >= 4500 || km % 5000 === 0;
  };

  const uniqueJenis = Array.from(new Set(data.map(d => d.jenis_kendaraan).filter(Boolean)));
  const uniqueKondisi = Array.from(new Set(data.map(d => d.kondisi).filter(Boolean)));

  const columns: ColumnDef<Vehicle>[] = [
    {
      header: "Nomor Polisi",
      accessorKey: "no_polisi",
      sortable: true,
      cell: (row) => <span className="font-semibold">{row.no_polisi}</span>,
    },
    {
      header: "Merk / Tipe",
      accessorKey: "merk",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.merk}</div>
          <div className="text-xs text-gray-500">{row.tipe} {row.tahun ? `(${row.tahun})` : ""}</div>
        </div>
      ),
    },
    {
      header: "Jenis",
      accessorKey: "jenis_kendaraan",
      sortable: true,
    },
    {
      header: "Pengguna",
      accessorKey: "pengguna",
      sortable: true,
    },
    {
      header: "Kondisi",
      accessorKey: "kondisi",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={row.kondisi || ""} />
          {isMaintenanceDue(row.km_kendaraan) && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertCircle size={10} />
              Segera Servis
            </span>
          )}
        </div>
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
          <button 
            onClick={(e) => { e.stopPropagation(); openForm(row); }}
            className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400 transition-colors"
            title="Edit Kendaraan"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.asset_id!); }}
            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 transition-colors"
            title="Hapus Kendaraan"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: Vehicle) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{row.no_polisi}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.merk} {row.tipe} {row.tahun ? `(${row.tahun})` : ""}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={row.kondisi || ""} />
          {isMaintenanceDue(row.km_kendaraan) && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <AlertCircle size={10} />
              Segera Servis
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Jenis</span>
          {row.jenis_kendaraan || "-"}
        </div>
        <div>
          <span className="block text-xs text-gray-400 dark:text-gray-500">Pengguna</span>
          {row.pengguna || "-"}
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
        <button 
          onClick={(e) => { e.stopPropagation(); openForm(row); }}
          className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400 transition-colors"
          title="Edit Kendaraan"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(row.asset_id!); }}
          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 transition-colors"
          title="Hapus Kendaraan"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Data Kendaraan Dinas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen master data kendaraan roda 2 dan roda 4</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
            Total: {filteredData.length} Kendaraan
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <Plus size={16} />
            Tambah Data
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput 
            placeholder="Cari nopol, merk, pengguna..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="w-full rounded-full neuglass-pressed text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            {uniqueJenis.map((j: any) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select 
            className="w-full rounded-full neuglass-pressed text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
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

      <DetailModal 
        isOpen={!!selectedItem && !isEditing} 
        onClose={() => setSelectedItem(null)} 
        title="Detail Kendaraan" 
        data={selectedItem ? {
          "Asset ID": selectedItem.asset_id,
          "Kode Barang": selectedItem.kode_barang,
          "Nomor Polisi": selectedItem.no_polisi,
          "Merk": selectedItem.merk,
          "Tipe": selectedItem.tipe,
          "Kondisi": selectedItem.kondisi,
          "Jenis Kendaraan": selectedItem.jenis_kendaraan,
          "Tahun Pembelian": selectedItem.tahun,
          "Pengguna": selectedItem.pengguna,
          "Unit Kerja": selectedItem.unit_kerja,
          "Kapasitas Mesin": (selectedItem as any).kapasitas_mesin,
          "No. BPKB": (selectedItem as any).no_bpkb,
          "No. Rangka": (selectedItem as any).no_rangka,
          "No. Mesin": (selectedItem as any).no_mesin,
          "Harga Pembelian": (selectedItem as any).harga_pembelian,
          "KM Kendaraan": (selectedItem as any).km_kendaraan,
        } : null} 
      >
        {selectedItem && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Kendaraan</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                {(selectedItem as any).foto ? (
                  <img 
                    src={(selectedItem as any).foto} 
                    alt="Foto" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/64748b?text=Image+Not+Found`;
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageOff size={24} className="mb-2" />
                    <span className="text-xs">Tidak ada foto</span>
                  </div>
                )}
              </div>
              {/* Note to user if it's an AppSheet relative path */}
              {(selectedItem as any).foto && (selectedItem as any).foto.includes("Kendaraan_Images") && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 text-center leading-tight mt-1 px-2">
                  Format path AppSheet terdeteksi. Gunakan URL foto publik yang lengkap.
                </span>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi Terakhir</span>
              <div className="w-full aspect-video bg-blue-50 dark:bg-blue-900/20 rounded-xl overflow-hidden flex items-center justify-center p-4 text-center">
                {selectedItem.latitude && selectedItem.longitude ? (
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="text-blue-500" size={24} />
                    <span className="text-xs text-gray-500 break-all">{selectedItem.latitude}, {selectedItem.longitude}</span>
                    <a href={`https://maps.google.com/?q=${selectedItem.latitude},${selectedItem.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline mt-1">Buka di Maps</a>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">Lokasi tidak tersedia</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QR Code</span>
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-none">
                 <QRCodeSVG value={(selectedItem as any).qr_url || selectedItem.asset_id || "N/A"} size={100} />
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Basic QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300" onClick={() => setSelectedQR(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[32px] shadow-xl max-w-sm w-full mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">QR Code Aset</h3>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
              <QRCodeSVG value={selectedQR} size={200} />
            </div>
            <button 
              onClick={() => setSelectedQR(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-medium transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Editing Form */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {formData.asset_id ? "Edit Kendaraan" : "Tambah Kendaraan"}
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden max-h-full">
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Nomor Polisi</label>
                  <input required value={formData.no_polisi || ""} onChange={e => setFormData({...formData, no_polisi: e.target.value, kode_barang: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: B 1234 ABC" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Merk / Model</label>
                  <input required value={formData.merk || ""} onChange={e => setFormData({...formData, merk: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Toyota Kijang" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Tipe</label>
                  <input value={formData.tipe || ""} onChange={e => setFormData({...formData, tipe: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Minibus" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Jenis Kendaraan</label>
                  <input value={formData.jenis_kendaraan || ""} onChange={e => setFormData({...formData, jenis_kendaraan: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: Kendaraan Roda 4" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Tahun Pembelian</label>
                  <input type="number" value={formData.tahun || ""} onChange={e => setFormData({...formData, tahun: parseInt(e.target.value) || undefined})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Contoh: 2018" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Kondisi</label>
                  <select value={formData.kondisi || "BAIK"} onChange={e => setFormData({...formData, kondisi: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
                    <option value="BAIK">BAIK</option>
                    <option value="RUSAK RINGAN">RUSAK RINGAN</option>
                    <option value="RUSAK BERAT">RUSAK BERAT</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Pengguna</label>
                  <input value={formData.pengguna || ""} onChange={e => setFormData({...formData, pengguna: e.target.value})} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm" placeholder="Nama Pengguna" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full font-medium text-sm transition-all border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-all">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
