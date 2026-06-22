import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function normalizeKey(key: string): string {
  if (!key) return "";
  return key
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Data normalizer
export function parseMoneyString(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const strValue = String(val).trim();
  const cleaned = strValue.replace(/[^0-9,.-]+/g, "");
  if (!cleaned) return 0;
  if (/,\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  } else if (/\.\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/,/g, "")) || 0;
  } else {
    return parseFloat(cleaned.replace(/[,.]/g, "")) || 0;
  }
}

export function normalizeData(data: any[]): any[] {
  return data.map((row) => {
    const normalizedRow: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const normKey = normalizeKey(key);
      
      // Alias handling for asset identification
      if (['nomor_polisi', 'nopol', 'plate'].includes(normKey)) {
        normalizedRow['no_polisi'] = value;
      }
      if (['asset_name', 'name', 'nama_barang'].includes(normKey)) {
        normalizedRow['nama_aset'] = value;
      }
      if (['id_asset', 'assetid'].includes(normKey)) {
        normalizedRow['asset_id'] = value;
      }

      // Value coercions
      let finalValue = value;
      if (typeof finalValue === 'string') {
        const valTrim = finalValue.trim();
        // Check if it's a number disguised as string (common in CSV)
        if (/^-?\d+(\.\d+)?$/.test(valTrim) && normKey !== 'no_polisi' && normKey !== 'id') {
          finalValue = parseFloat(valTrim);
        }
      }

      normalizedRow[normKey] = finalValue || value;
    }
    return normalizedRow;
  });
}
