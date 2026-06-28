import React, { useEffect, useState, useMemo } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { apiService } from "@/services/apiService";
import { Pegawai } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Search, Info, Briefcase, UserCircle, Calendar, AlertTriangle,
  Package, ZoomIn, ImageOff, Phone, GraduationCap, Clock,
  CheckCircle2, CircleDot, Car, Wrench, Archive, ChevronDown, RefreshCw, Plus, Edit2, X, Save, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoadingState } from "@/components/ui/LoadingState";
import { DetailModal } from "@/components/ui/DetailModal";
import { PegawaiFormModal } from "@/components/ui/PegawaiFormModal";
import { formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function MatchBadge({ quality }: { quality: "exact" | "fuzzy" | "none" }) {
  if (quality === "exact")
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
        <CheckCircle2 size={8} /> VERIFIED
      </span>
    );
  if (quality === "fuzzy")
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
        <CircleDot size={8} /> FUZZY
      </span>
    );
  return null;
}

function KGBStatus({ tglKgb }: { tglKgb: string }) {
  if (!tglKgb) return <span className="text-gray-400 text-xs">-</span>;
  const d = new Date(tglKgb);
  const today = new Date();
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays >= 0 && diffDays <= 180;

  return (
    <span className={`text-xs font-semibold ${isUrgent ? "text-yellow-600 dark:text-yellow-400" : "text-gray-600 dark:text-gray-400"}`}>
      {formatDate(tglKgb)}
      {isUrgent && <span className="ml-1 text-yellow-500">⚠</span>}
    </span>
  );
}

function PensiunStatus({ tglPensiun }: { tglPensiun: string }) {
  if (!tglPensiun) return <span className="text-gray-400 text-xs">-</span>;
  const d = new Date(tglPensiun);
  const today = new Date();
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isNear = diffDays >= 0 && diffDays <= 365;

  return (
    <span className={`text-xs font-semibold ${isNear ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}>
      {formatDate(tglPensiun)}
      {isNear && <span className="ml-1 text-red-500">🔴</span>}
    </span>
  );
}

function PegawaiAvatar({ foto, nama, size = "md" }: { foto: string; nama: string; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const cls = { sm: "w-9 h-9", md: "w-11 h-11", lg: "w-28 h-28 text-4xl" }[size];
  const textCls = { sm: "text-sm", md: "text-base", lg: "text-3xl" }[size];
  const initial = nama ? nama.charAt(0).toUpperCase() : "?";

  if (!foto || imgError) {
    return (
      <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ${textCls} shrink-0`}>
        {initial}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={nama}
      className={`${cls} rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shrink-0`}
      onError={() => setImgError(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Asset Card inside 360° modal
// ---------------------------------------------------------------------------
function AssetCard({ asset, type, onSelect }: { key?: React.Key; asset: any; type: "kendaraan" | "alat" | "inventaris"; onSelect: (a: any) => void }) {
  const [imgErr, setImgErr] = useState(false);

  const label = type === "kendaraan"
    ? (asset.no_polisi || asset.kode_barang)
    : (asset.nama_aset || asset.kode_barang);

  const sublabel = type === "kendaraan"
    ? `${asset.merk || ""} ${asset.tipe || ""}`.trim() || asset.jenis_kendaraan || ""
    : `${asset.merk || ""} ${asset.tahun || ""}`.trim();

  const photoSrc = type === "kendaraan" && asset.foto
    ? (asset.foto.includes("Kendaraan_Images")
      ? `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=Kendaraan&fileName=${encodeURIComponent(asset.foto)}`
      : asset.foto)
    : (asset.foto || "");

  const kondisi = String(asset.kondisi || "BAIK").toUpperCase();
  const kondisiColor =
    kondisi === "BAIK" ? "bg-green-100 text-green-700" :
    kondisi.includes("RINGAN") ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  const TypeIcon = type === "kendaraan" ? Car : type === "alat" ? Wrench : Archive;

  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col"
      onClick={() => onSelect(asset)}
    >
      <div className="w-full h-28 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {photoSrc && !imgErr ? (
          <img src={photoSrc} alt={label} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <TypeIcon size={28} className="text-gray-400" />
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">{label}</h5>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${kondisiColor}`}>{kondisi}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{sublabel}</p>
          {asset.asset_id && (
            <p className="text-[10px] text-gray-400 mt-1 font-mono">{asset.asset_id}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 360° Profile Modal
// ---------------------------------------------------------------------------
function ProfileModal({
  pegawai,
  onClose,
  onSelectAsset,
  onEdit,
  onDelete,
}: {
  pegawai: Pegawai;
  onClose: () => void;
  onSelectAsset: (a: any) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [openSection, setOpenSection] = useState<string>("biodata");
  const totalAssets = pegawai.assets?.length || 0;

  const toggle = (s: string) => setOpenSection((p) => (p === s ? "" : s));

  function Section({ id, title, icon: Icon, children, count }: any) {
    const isOpen = openSection === id;
    return (
      <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => toggle(id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <div className="flex items-center gap-2 font-bold text-base">
            <Icon size={18} className="text-blue-500" />
            {title}
            {count !== undefined && (
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                {count}
              </span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && <div className="p-4">{children}</div>}
      </div>
    );
  }

  function InfoRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
      <div className="flex flex-col border-b border-gray-100 dark:border-gray-800/50 pb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{value}</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-bold">Profil Pegawai 360°</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-0 md:gap-6 p-6">

            {/* Sidebar */}
            <div className="w-full md:w-56 shrink-0 flex flex-col items-center text-center mb-6 md:mb-0">
              <PegawaiAvatar foto={pegawai.foto} nama={pegawai.nama} size="lg" />
              <div className="flex items-center gap-1 mt-3 justify-center">
                <h3 className="text-lg font-bold leading-tight">{pegawai.nama}</h3>
              </div>
              <p className="text-xs font-mono text-gray-500 mt-0.5 break-all">{pegawai.nip}</p>
              
              {pegawai.is_incomplete && (
                <div className="mt-3 bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-2 rounded-lg flex items-start gap-2 text-left w-full border border-amber-200 dark:border-amber-800/50">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium">Informasi biodata pegawai ini belum lengkap (NIP, Jabatan, Golongan, atau Status kosong).</p>
                </div>
              )}

              <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full ${
                pegawai.status === "ASN"
                  ? "bg-blue-100 text-blue-700"
                  : pegawai.status === "PPPK"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {pegawai.status || "-"}
              </span>
              {pegawai.match_quality !== "none" && (
                <div className="mt-2">
                  <MatchBadge quality={pegawai.match_quality} />
                </div>
              )}
              
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-200 dark:border-blue-800/50"
                >
                  <Edit2 size={14} />
                  Edit Pegawai
                </button>
              )}

              {onDelete && (
                <button
                  onClick={onDelete}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-xl transition-colors border border-red-200 dark:border-red-800/50"
                >
                  <Trash2 size={14} />
                  Hapus (Nonaktifkan)
                </button>
              )}

              <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl w-full text-left space-y-2">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Golongan</p>
                  <p className="text-sm font-bold">{pegawai.golongan || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jabatan</p>
                  <p className="text-xs font-semibold leading-tight">{pegawai.jabatan || "-"}</p>
                </div>
                {pegawai.unit_kerja && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Unit Kerja</p>
                    <p className="text-xs font-semibold leading-tight">{pegawai.unit_kerja}</p>
                  </div>
                )}
                {totalAssets > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tanggungan Aset</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{totalAssets} Item</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main sections */}
            <div className="flex-1 space-y-3 min-w-0">

              {/* Biodata */}
              <Section id="biodata" title="Informasi Lengkap (Biodata/SK)" icon={UserCircle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow label="Nomor Induk Pegawai (NIP)" value={pegawai.nip} />
                  <InfoRow label="Nama Lengkap" value={pegawai.nama} />
                  <InfoRow label="Status Kepegawaian" value={pegawai.status || "-"} />
                  <InfoRow label="Golongan / Ruang" value={pegawai.golongan} />
                  <InfoRow label="Jabatan" value={pegawai.jabatan} />
                  <InfoRow label="Unit Kerja / Bidang" value={pegawai.unit_kerja} />
                  <InfoRow label="Tanggal Lahir" value={pegawai.tgl_lahir} />
                  <InfoRow label="Usia" value={pegawai.usia} />
                  <InfoRow label="Masa Kerja" value={
                    pegawai.masa_kerja_tahun
                      ? `${pegawai.masa_kerja_tahun} tahun ${pegawai.masa_kerja_bulan} bulan`
                      : ""
                  } />
                  <InfoRow label="Kontak" value={pegawai.kontak} />
                </div>
              </Section>

              {/* Pendidikan & Diklat */}
              <Section id="pendidikan" title="Pendidikan & Riwayat Diklat" icon={GraduationCap}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow label="Tingkat Pendidikan" value={pegawai.tingkat} />
                  <InfoRow label="Jurusan / Program Studi" value={pegawai.pendidikan_jurusan} />
                  <InfoRow label="Universitas / Institusi" value={pegawai.universitas} />
                  <InfoRow label="Tahun Lulus" value={pegawai.tahun_lulus} />
                  <InfoRow label="Riwayat Diklat" value={pegawai.riwayat_diklat} />
                  <InfoRow label="Tahun Diklat" value={pegawai.tahun_diklat} />
                </div>
              </Section>

              {/* Buku Penjagaan */}
              <Section id="penjagaan" title="Buku Penjagaan Cerdas" icon={AlertTriangle}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Jadwal KGB Berikutnya</p>
                    <KGBStatus tglKgb={pegawai.tgl_kgb} />
                    <p className="text-[10px] text-yellow-600 mt-1">
                      Mulai Golongan: {pegawai.tgl_mulai_golongan || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Usulan Kenaikan Pangkat</p>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {pegawai.tgl_pangkat ? formatDate(pegawai.tgl_pangkat) : "-"}
                    </span>
                    <p className="text-[10px] text-blue-600 mt-1">
                      Mulai Jabatan: {pegawai.tgl_mulai_jabatan || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Batas Usia Pensiun</p>
                    <PensiunStatus tglPensiun={pegawai.tgl_pensiun} />
                    <p className="text-[10px] text-red-600 mt-1">
                      Tgl. Lahir: {pegawai.tgl_lahir || "-"}
                    </p>
                  </div>
                </div>
                {pegawai.catatan_mutasi_masuk && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Catatan Mutasi Masuk" value={pegawai.catatan_mutasi_masuk} />
                    <InfoRow label="Catatan Mutasi Keluar" value={pegawai.catatan_mutasi_keluar} />
                  </div>
                )}
                {pegawai.keterangan && (
                  <div className="mt-3">
                    <InfoRow label="Keterangan" value={pegawai.keterangan} />
                  </div>
                )}
              </Section>

              {/* Tanggungan Aset */}
              <Section id="aset" title="Tanggungan Aset / Fasilitas" icon={Package} count={totalAssets}>
                {totalAssets === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-xl p-6 text-center">
                    <Info className="mx-auto text-gray-400 mb-2" size={20} />
                    <p className="text-sm text-gray-500">
                      Tidak ada aset yang terhubung untuk {pegawai.nama}.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Selaraskan nama holder di Google Sheets agar sistem dapat mencocokkan aset.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pegawai.assets_kendaraan && pegawai.assets_kendaraan.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Car size={14} className="text-blue-500" />
                          <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Kendaraan ({pegawai.assets_kendaraan.length})
                          </h5>
                          {pegawai.match_quality !== "none" && <MatchBadge quality={pegawai.match_quality} />}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pegawai.assets_kendaraan.map((a, i) => (
                            <AssetCard key={i} asset={a} type="kendaraan" onSelect={onSelectAsset} />
                          ))}
                        </div>
                      </div>
                    )}
                    {pegawai.assets_alat_mesin && pegawai.assets_alat_mesin.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench size={14} className="text-green-500" />
                          <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Alat & Mesin ({pegawai.assets_alat_mesin.length})
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pegawai.assets_alat_mesin.map((a, i) => (
                            <AssetCard key={i} asset={a} type="alat" onSelect={onSelectAsset} />
                          ))}
                        </div>
                      </div>
                    )}
                    {pegawai.assets_inventaris && pegawai.assets_inventaris.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Archive size={14} className="text-orange-500" />
                          <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Inventaris ({pegawai.assets_inventaris.length})
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pegawai.assets_inventaris.map((a, i) => (
                            <AssetCard key={i} asset={a} type="inventaris" onSelect={onSelectAsset} />
                          ))}
                        </div>
                      </div>
                    )}

                    {pegawai.status === "PENSIUN" && totalAssets > 0 && (
                      <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Pegawai Pensiun — Segera lakukan penarikan {totalAssets} aset.
                      </div>
                    )}
                  </div>
                )}
              </Section>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PegawaiPage() {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGolongan, setFilterGolongan] = useState("all");
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);

  async function handleDelete(p: Pegawai) {
    const ok = window.confirm(
      `Nonaktifkan pegawai "${p.nama}" (NIP ${p.nip})?\n\nData tidak dihapus permanen — hanya disembunyikan dari daftar aktif (soft delete) dan tetap tersimpan untuk audit.`
    );
    if (!ok) return;
    try {
      await apiService.deletePegawai(String(p.nip));
      spreadsheetService.clearCache();
      setSelectedPegawai(null);
      await load(true);
    } catch (err: any) {
      alert(err?.message || "Gagal menonaktifkan pegawai.");
    }
  }

  async function load(force = false) {
    if (force) {
      setIsRefreshing(true);
      spreadsheetService.clearCache();
    } else {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const result = await spreadsheetService.getPegawai();
      setData(result);
      setLastSync(spreadsheetService.getLastUpdated());
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat data pegawai.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Golongan level options for filter
  const golonganLevels = useMemo(() => {
    const levels = new Set(data.map((p) => (p.golongan || "").split("/")[0]).filter(Boolean));
    return Array.from(levels).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((p) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        p.nama.toLowerCase().includes(search) ||
        p.nip.includes(search) ||
        (p.unit_kerja || "").toLowerCase().includes(search) ||
        (p.jabatan || "").toLowerCase().includes(search) ||
        (p.golongan || "").toLowerCase().includes(search);

      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchGolongan =
        filterGolongan === "all" || (p.golongan || "").startsWith(filterGolongan);

      const matchIncomplete = filterIncomplete ? p.is_incomplete : true;

      return matchSearch && matchStatus && matchGolongan && matchIncomplete;
    });
  }, [data, searchTerm, filterStatus, filterGolongan, filterIncomplete]);

  // Match summary stats
  const matchStats = useMemo(() => {
    const withAssets = data.filter((p) => (p.assets?.length || 0) > 0).length;
    const exact = data.filter((p) => p.match_quality === "exact").length;
    const fuzzy = data.filter((p) => p.match_quality === "fuzzy").length;
    const none = data.filter((p) => p.match_quality === "none").length;
    return { withAssets, exact, fuzzy, none };
  }, [data]);

  if (loading) return <LoadingState />;

  if (errorMsg) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md text-center border border-red-200">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-50" />
          <h2 className="font-bold mb-2">Gagal Memuat Data Pegawai</h2>
          <p className="text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Pegawai / ASN</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola profil, jabatan, dan tanggungan aset · {data.length} pegawai
          </p>
          {lastSync && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Terakhir sinkronisasi: {new Date(lastSync).toLocaleString("id-ID")}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari NIP, Nama, Jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Menyinkronkan..." : "Sinkronisasi"}
          </button>
          <button
            onClick={() => {
              setEditingPegawai(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            <Plus size={16} />
            Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Match analysis banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pegawai", val: data.length, color: "text-gray-800 dark:text-gray-200", bg: "bg-gray-100 dark:bg-gray-800" },
          { label: "Aset Terverifikasi", val: matchStats.exact, color: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Aset Fuzzy Match", val: matchStats.fuzzy, color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Tanpa Aset", val: matchStats.none, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/30" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="ASN">ASN</option>
          <option value="PPPK">PPPK</option>
          <option value="">Status Kosong</option>
        </select>
        <select
          value={filterGolongan}
          onChange={(e) => setFilterGolongan(e.target.value)}
          className="text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Golongan</option>
          {golonganLevels.map((l) => (
            <option key={l} value={l}>Golongan {l}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterIncomplete(!filterIncomplete)}
          className={`text-sm px-3 py-1.5 flex items-center gap-1.5 rounded-lg border transition-colors ${
            filterIncomplete 
              ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400" 
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <AlertTriangle size={14} />
          Data Tidak Lengkap
        </button>
        {(filterStatus !== "all" || filterGolongan !== "all" || filterIncomplete || searchTerm) && (
          <button
            onClick={() => { setFilterStatus("all"); setFilterGolongan("all"); setFilterIncomplete(false); setSearchTerm(""); }}
            className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Reset Filter
          </button>
        )}
        <span className="text-sm text-gray-400 self-center ml-auto">
          Menampilkan {filteredData.length} dari {data.length} pegawai
        </span>
      </div>

      {/* Table — Desktop */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium">Profil</th>
                <th className="p-4 font-medium">NIP</th>
                <th className="p-4 font-medium">Golongan</th>
                <th className="p-4 font-medium">Jabatan & Unit Kerja</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">KGB Berikutnya</th>
                <th className="p-4 font-medium">Aset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((pegawai, index) => (
                <motion.tr
                  key={pegawai.nip || index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                    pegawai.is_incomplete ? "bg-amber-50/30 dark:bg-amber-900/10" : ""
                  }`}
                  onClick={() => setSelectedPegawai(pegawai)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <PegawaiAvatar foto={pegawai.foto} nama={pegawai.nama} size="sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight max-w-[180px] truncate">
                          {pegawai.nama}
                        </span>
                        {pegawai.is_incomplete && (
                          <span 
                            title="Data profil belum lengkap (NIP, Jabatan, Golongan, atau Status kosong)"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800/50"
                          >
                            <AlertTriangle size={10} />
                            Tidak Lengkap
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {pegawai.nip}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{pegawai.golongan}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">
                      {pegawai.jabatan}
                    </div>
                    {pegawai.unit_kerja && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{pegawai.unit_kerja}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      pegawai.status === "ASN"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                        : pegawai.status === "PPPK"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {pegawai.status || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <KGBStatus tglKgb={pegawai.tgl_kgb} />
                  </td>
                  <td className="p-4">
                    {(pegawai.assets?.length || 0) > 0 ? (
                      <div className="flex items-center gap-1">
                        <div className={`flex items-center gap-1 text-sm font-bold ${
                          pegawai.match_quality === "exact"
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}>
                          <Package size={13} />
                          <span>{pegawai.assets?.length}</span>
                        </div>
                        <MatchBadge quality={pegawai.match_quality} />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>Tidak ada pegawai yang sesuai dengan filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cards — Mobile */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredData.map((pegawai, index) => (
          <motion.div
            key={pegawai.nip || index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.4) }}
            whileHover={{ scale: 1.01 }}
            className="cursor-pointer"
            onClick={() => setSelectedPegawai(pegawai)}
          >
            <Card className="overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <PegawaiAvatar foto={pegawai.foto} nama={pegawai.nama} size="md" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight text-sm truncate">
                        {pegawai.nama}
                      </h3>
                      {pegawai.is_incomplete && (
                        <span 
                          title="Data profil belum lengkap (NIP, Jabatan, Golongan, atau Status kosong)"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800/50"
                        >
                          <AlertTriangle size={10} />
                          Tidak Lengkap
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5">{pegawai.nip}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                        pegawai.status === "ASN"
                          ? "bg-blue-100 text-blue-700"
                          : pegawai.status === "PPPK"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {pegawai.status || "-"}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 text-gray-700">
                        {pegawai.golongan || "-"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Briefcase size={11} className="shrink-0" />
                    <span className="truncate">{pegawai.jabatan}</span>
                  </div>
                  {pegawai.unit_kerja && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <UserCircle size={11} className="shrink-0" />
                      <span className="truncate">{pegawai.unit_kerja}</span>
                    </div>
                  )}
                  {(pegawai.assets?.length || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                      <Package size={11} className="shrink-0" />
                      <span>{pegawai.assets?.length} Aset</span>
                      <MatchBadge quality={pegawai.match_quality} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full p-10 text-center text-gray-500">
            Tidak ada data yang sesuai.
          </div>
        )}
      </div>

      {/* Profile 360° Modal */}
      <AnimatePresence>
        {selectedPegawai && (
          <ProfileModal
            pegawai={selectedPegawai}
            onClose={() => setSelectedPegawai(null)}
            onSelectAsset={(a) => { setSelectedAsset(a); }}
            onEdit={() => {
              setSelectedPegawai(null);
              setEditingPegawai(selectedPegawai);
              setIsFormModalOpen(true);
            }}
            onDelete={() => handleDelete(selectedPegawai)}
          />
        )}
      </AnimatePresence>

      {/* Asset Detail Modal */}
      <DetailModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title="Detail Aset"
        data={
          selectedAsset
            ? {
                "Asset ID": selectedAsset.asset_id,
                "Kode Barang / No. Polisi": selectedAsset.no_polisi || selectedAsset.kode_barang,
                "Nama Aset": selectedAsset.nama_aset || selectedAsset.jenis_kendaraan,
                Merk: selectedAsset.merk,
                Tipe: selectedAsset.tipe,
                Tahun: selectedAsset.tahun,
                Kondisi: selectedAsset.kondisi,
                Pengguna: selectedAsset.pengguna,
                "No. BPKB": selectedAsset.no_bpkb,
                "No. Rangka": selectedAsset.no_rangka,
                "No. Mesin": selectedAsset.no_mesin,
                "Kapasitas Mesin": selectedAsset.kapasitas_mesin,
                "Harga Perolehan": selectedAsset.harga_pembelian,
                "KM / Kondisi Pemakaian": selectedAsset.km_kendaraan,
              }
            : null
        }
      >
        {selectedAsset && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Photo */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Aset</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center group relative">
                {selectedAsset.foto ? (
                  <>
                    <img
                      src={
                        selectedAsset.foto.includes("Kendaraan_Images")
                          ? `https://www.appsheet.com/template/gettablefileurl?appName=SIMOSDA-845158139&tableName=Kendaraan&fileName=${encodeURIComponent(selectedAsset.foto)}`
                          : selectedAsset.foto
                      }
                      alt="Foto"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={(e) => setZoomedImage(e.currentTarget.src)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/64748b?text=Foto+Tidak+Tersedia`;
                        (e.target as HTMLImageElement).onerror = null;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <ZoomIn className="text-white drop-shadow-md" size={28} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageOff size={24} className="mb-1" />
                    <span className="text-xs">Tidak ada foto</span>
                  </div>
                )}
              </div>
            </div>
            {/* Map */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi Terakhir</span>
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative group">
                {selectedAsset.latitude && selectedAsset.longitude ? (
                  (() => {
                    const lat = String(selectedAsset.latitude).replace(",", ".").trim();
                    const lng = String(selectedAsset.longitude).replace(",", ".").trim();
                    return (
                      <>
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                          allowFullScreen
                          title="Lokasi Aset"
                          loading="lazy"
                        />
                        <a
                          href={`https://maps.google.com/?q=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md"
                        >
                          Buka di Maps
                        </a>
                      </>
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                    <AlertTriangle size={22} className="mb-2 opacity-50" />
                    <span className="text-xs">Koordinat tidak tersedia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Image zoom */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <PegawaiFormModal
            isOpen={isFormModalOpen}
            initialData={editingPegawai}
            onClose={() => setIsFormModalOpen(false)}
            onSuccess={() => {
              setIsFormModalOpen(false);
              load(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
