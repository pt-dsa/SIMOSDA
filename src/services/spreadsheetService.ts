import Papa from "papaparse";
import { normalizeData, parseMoneyString } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

const SPREADSHEET_ID = "19EllcHpSDAANnoXcTCYI8LIR9TE7b_e_Cst0KMgveO0";
const CACHE_EXPIRY = 60 * 1000; // 1 minute cache

async function fetchFromSheet(sheetName: string): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  const cacheKey = `sheet_v4_${sheetName}`;
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
        return parsed.data;
      }
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal mengambil data dari Spreadsheet. Pastikan URL terbuka untuk publik (Viewer).");
    const text = await response.text();
    
    // Check if it's an HTML error page (happens if sheet doesn't exist or isn't public)
    if (text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error(`Sheet '${sheetName}' tidak ditemukan atau Google Spreadsheet tidak diset 'Anyone with link can view'.`);
    }

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data;
          const normalized = normalizeData(rawData);
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: normalized }));
          sessionStorage.setItem('sheet_last_updated', new Date().toISOString());
          resolve(normalized);
        },
        error: (error) => {
          reject(new Error(`Gagal parsing CSV: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.warn(`Failed fetching sheet ${sheetName}:`, error);
    throw error;
  }
}

export const spreadsheetService = {
  getLastUpdated() {
    return sessionStorage.getItem('sheet_last_updated');
  },

  async getVehicles() {
    const data = await fetchFromSheet("assets_vehicle");
    return data.map((item: any) => {
      // Map to a clean object so detail modal looks professional
      return {
        asset_id: item.asset_id,
        kode_barang: item.asset_code || item.kode_barang,
        no_polisi: item.plate_number || item.no_polisi || item.asset_code,
        merk: item.brand || item.merk || "-",
        tipe: item.vehicle_type || item.tipe || "-",
        tahun: item.purchase_year || item.tahun || "-",
        jenis_kendaraan: item.asset_category || item.jenis_kendaraan || item.nama_aset,
        pengguna: item.holder_name || item.pengguna || "-",
        unit_kerja: item.usage || item.unit_kerja || "-",
        kondisi: (item.kondisi || item.condition || "BAIK").toUpperCase(),
        kapasitas_mesin: item.engine_capacity_cc ? `${item.engine_capacity_cc} CC` : item.cc || "-",
        no_bpkb: item.bpkb_number || item.no_bpkb || "-",
        no_rangka: item.chassis_number || item.no_rangka || "-",
        no_mesin: item.engine_number || item.no_mesin || "-",
        harga_pembelian: item.acquisition_price ? `Rp ${new Intl.NumberFormat('id-ID').format(item.acquisition_price)}` : item.harga_pembelian || "-",
        km_kendaraan: item.current_km ? `${new Intl.NumberFormat('id-ID').format(item.current_km)} KM` : item.km_kendaraan || "-",
        latitude: item.lat || item.latitude,
        longitude: item.lng || item.longitude,
        foto: item.photo_legacy || item.foto || item.photo,
        qr_url: item.qr_legacy_url || item.qr_url,
      };
    });
  },

  async getEquipment() {
    return await fetchFromSheet("assets_equipment");
  },

  async getInventory() {
    return await fetchFromSheet("assets_inventory");
  },

  async getBudgets() {
    const data = await fetchFromSheet("vehicle_budget");
    
    // Auto calculate if missing
    return data.map(item => {
      const ps = parseMoneyString(item.service_budget || item.pagu_service);
      const pc = parseMoneyString(item.sparepart_budget || item.pagu_suku_cadang);
      const rs = parseMoneyString(item.service_realization || item.realisasi_service);
      const rc = parseMoneyString(item.sparepart_realization || item.realisasi_suku_cadang);
      const total_pagu_explicit = parseMoneyString(item.total_budget || item.total_pagu);
      const total_realisasi_explicit = parseMoneyString(item.total_realization || item.total_realisasi);
      
      const tp = total_pagu_explicit || (ps + pc);
      const tr = total_realisasi_explicit || (rs + rc);
      
      return {
        ...item,
        no_polisi: item.plate_number || item.no_polisi,
        tahun_anggaran: item.year || item.tahun || item.tahun_anggaran,
        total_pagu: tp,
        total_realisasi: tr,
        sisa_anggaran: parseMoneyString(item.total_remaining) || item.sisa_anggaran || (tp - tr),
        persentase_realisasi: tp > 0 ? (tr / tp) * 100 : 0
      };
    });
  },

  async getMaintenance() {
    const data = await fetchFromSheet("vehicle_maintenance");
    return data.map(item => ({
      ...item,
      biaya: parseMoneyString(item.total_cost) || parseMoneyString(item.biaya)
    }));
  },
  
  async getEquipmentMaintenance() {
    const data = await fetchFromSheet("equipment_maintenance");
    return data.map(item => ({
      ...item,
      biaya: parseMoneyString(item.maintenance_cost) || parseMoneyString(item.biaya)
    }));
  },

  async getLoans() {
    return await fetchFromSheet("loans");
  },

  async getLocations() {
    return await fetchFromSheet("asset_locations");
  },

  async getMaintenanceForecast() {
    const [vehicles, equipment] = await Promise.all([
      this.getMaintenance(),
      this.getEquipmentMaintenance()
    ]);

    const allRecords = [...vehicles, ...equipment];
    const groupedByMonth: Record<string, { total: number, count: number }> = {};
    
    // Calculate totals per month based on request_date
    let totalHistoricalCost = 0;
    
    allRecords.forEach(record => {
      const dateStr = record.request_date || record.tanggal || '';
      const cost = record.biaya || 0;
      if (dateStr && cost > 0) {
        // Assume date is YYYY-MM-DD or similar
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            if (!groupedByMonth[yearMonth]) {
                groupedByMonth[yearMonth] = { total: 0, count: 0 };
            }
            groupedByMonth[yearMonth].total += cost;
            groupedByMonth[yearMonth].count += 1;
            totalHistoricalCost += cost;
        }
      }
    });

    const monthsWithData = Object.keys(groupedByMonth).length;
    let avgMonthlyCost = 0;
    if (monthsWithData > 0) {
        // Average monthly based on the months that actually had maintenance data
        avgMonthlyCost = totalHistoricalCost / monthsWithData;
    }
    
    // Forecast next 6 months
    const today = new Date();
    const forecast = [];
    for (let i = 1; i <= 6; i++) {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const name = nextMonth.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        
        // simple baseline prediction + slight random variation between -5% to +5% 
        // to make the chart look more natural
        const variation = 1 + (Math.random() * 0.1 - 0.05);
        const predictedCost = avgMonthlyCost * variation;
        
        forecast.push({
            name,
            PredictedCost: predictedCost,
        });
    }

    return {
        avgMonthlyCost,
        sixMonthTotal: avgMonthlyCost * 6,
        forecastData: forecast
    };
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [vehicles, equipment, inventory, loans, maintenance, budgets, forecast] = await Promise.all([
      this.getVehicles(),
      this.getEquipment(),
      this.getInventory(),
      this.getLoans(),
      this.getMaintenance(),
      this.getBudgets(),
      this.getMaintenanceForecast(),
    ]);

    const totalPagu = budgets.reduce((sum, item) => sum + parseMoneyString(item.total_pagu), 0);
    const totalRealisasi = budgets.reduce((sum, item) => sum + parseMoneyString(item.total_realisasi), 0);

    const currentYear = new Date().getFullYear();
    const trendYears = Array.from({ length: 5 }, (_, i) => String(currentYear - 4 + i));
    
    const trendsMap: Record<string, { name: string; Vehicles: number; Equipment: number; Inventory: number }> = {};
    trendYears.forEach(year => {
      trendsMap[year] = { name: year, Vehicles: 0, Equipment: 0, Inventory: 0 };
    });

    const processTrend = (items: any[], type: 'Vehicles' | 'Equipment' | 'Inventory') => {
      items.forEach(item => {
        const year = String(item.purchase_year || item.tahun || item.tahun_perolehan || item.tahun_pembelian || '').substring(0, 4);
        if (trendsMap[year]) {
          trendsMap[year][type]++;
        }
      });
    };

    processTrend(vehicles, 'Vehicles');
    processTrend(equipment, 'Equipment');
    processTrend(inventory, 'Inventory');

    const assetTrends = trendYears.map(year => trendsMap[year]);

    return {
      totalKendaraan: vehicles.length,
      totalAlatMesin: equipment.length,
      totalInventaris: inventory.length,
      totalAset: vehicles.length + equipment.length + inventory.length,
      totalPeminjaman: loans.length,
      totalPemeliharaan: maintenance.length, // if you want eq maint as well, add eq maint length here later
      totalPagu,
      totalRealisasi,
      persenRealisasi: totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0,
      lastUpdated: this.getLastUpdated(),
      assetTrends,
      maintenanceForecast: forecast
    };
  }
};
