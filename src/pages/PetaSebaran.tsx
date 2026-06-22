import React, { useState, useEffect } from "react";
import { spreadsheetService } from "@/services/spreadsheetService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card } from "@/components/ui/Card";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function PetaSebaran() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await spreadsheetService.getLocations();
        setLocations(data.filter((item: any) => {
          if (!item.lat || !item.lng) return false;
          const lat = Number(String(item.lat).replace(',', '.'));
          const lng = Number(String(item.lng).replace(',', '.'));
          return !isNaN(lat) && !isNaN(lng);
        }).map((item: any) => ({
          ...item,
          lat: Number(String(item.lat).replace(',', '.')),
          lng: Number(String(item.lng).replace(',', '.'))
        })));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading peta...</div>;

  const center: [number, number] = locations.length > 0
    ? [Number(locations[0].lat), Number(locations[0].lng)]
    : [-6.200000, 106.816666]; // Default to Jakarta if no data

  // Prepare custom icons based on asset_type
  const getCustomIcon = (type: string) => {
    let color = "#0B57D0"; // default blue
    const t = String(type || "").toLowerCase();
    if (t === "vehicle") color = "#4F46E5"; // indigo
    else if (t === "equipment") color = "#16A34A"; // green
    else if (t === "inventory") color = "#D97706"; // amber

    const markerHtmlStyles = `
      background-color: ${color};
      width: 20px;
      height: 20px;
      display: block;
      left: -10px;
      top: -10px;
      position: relative;
      border-radius: 50%;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `;

    return L.divIcon({
      className: "custom-pin",
      iconAnchor: [0, 10],
      tooltipAnchor: [10, 0],
      popupAnchor: [0, -10],
      html: `<span style="${markerHtmlStyles}" />`
    });
  };

  const getStats = () => {
    const stats: Record<string, number> = {};
    locations.forEach(l => {
      const type = String(l.asset_type || "Other").toLowerCase();
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  };
  const stats = getStats();

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Peta Sebaran Aset</h1>
        <p className="text-sm text-gray-500">Visualisasi lokasi geografis kendaraan dan aset lainnya</p>
      </div>

      <Card className="flex-1 min-h-[400px] overflow-hidden p-0 relative border-2 border-white">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 10 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((item, idx) => (
            <Marker key={idx} position={[Number(item.lat), Number(item.lng)]} icon={getCustomIcon(item.asset_type)}>
              <Popup className="rounded-xl">
                <div className="p-1 space-y-2 text-sm">
                  <div className="font-bold text-base border-b pb-1 text-gray-900">
                    {item.asset_label || item.asset_id || "Unknown"}
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-gray-500">Type:</span> <span className="capitalize">{item.asset_type}</span></p>
                    {item.address && <p><span className="text-gray-500">Alamat:</span> {item.address}</p>}
                  </div>
                  <a 
                    href={item.maps_url || `https://maps.google.com/?q=${item.lat},${item.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 text-center bg-blue-50 text-blue-600 rounded-md py-1.5 text-xs font-semibold hover:bg-blue-100"
                  >
                    Buka di Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 text-xs font-medium space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">Legenda</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4F46E5" }}></div>
              <span className="text-gray-700">Kendaraan ({stats['vehicle'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#16A34A" }}></div>
              <span className="text-gray-700">Alat & Mesin ({stats['equipment'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#D97706" }}></div>
              <span className="text-gray-700">Inventaris ({stats['inventory'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0B57D0" }}></div>
              <span className="text-gray-700">Lainnya ({stats['other'] || 0})</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
