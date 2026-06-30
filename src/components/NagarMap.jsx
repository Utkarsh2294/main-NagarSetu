import { useEffect, useRef } from "react";
import L from "leaflet";
export default function NagarMap({
  issues,
  hotspots,
  showHotspots,
  selectedIssueId,
  onSelectIssue,
  newReportCoords,
  onSelectCoords,
  userCoords
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const hotspotLayersRef = useRef([]);
  const newReportMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const defaultCenter = [12.9716, 77.5946];
    const initialCenter = userCoords ? [userCoords.lat, userCoords.lng] : defaultCenter;
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);
    map.on("click", (e) => {
      onSelectCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userIcon = L.divIcon({
        html: `
          <div class="relative flex h-5 w-5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        className: "custom-user-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userLocationMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1e3
      }).addTo(map);
      map.setView([userCoords.lat, userCoords.lng], 14);
    }
  }, [userCoords]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!newReportCoords) {
      if (newReportMarkerRef.current) {
        newReportMarkerRef.current.remove();
        newReportMarkerRef.current = null;
      }
      return;
    }
    if (newReportMarkerRef.current) {
      newReportMarkerRef.current.setLatLng([newReportCoords.lat, newReportCoords.lng]);
    } else {
      const pinIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-indigo-600 text-white rounded-full p-2 shadow-lg border-2 border-white animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="bg-indigo-600 text-white text-[10px] font-medium font-sans px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              Place Report Here
            </div>
          </div>
        `,
        className: "new-report-pin",
        iconSize: [80, 50],
        iconAnchor: [40, 25]
      });
      newReportMarkerRef.current = L.marker([newReportCoords.lat, newReportCoords.lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);
      newReportMarkerRef.current.on("dragend", (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        onSelectCoords({ lat: position.lat, lng: position.lng });
      });
    }
    map.panTo([newReportCoords.lat, newReportCoords.lng]);
  }, [newReportCoords]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.keys(markersRef.current).forEach((id) => {
      if (!issues.find((i) => i.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    issues.forEach((issue) => {
      const isSelected = issue.id === selectedIssueId;
      const { status, category, reportCount } = issue;
      let markerColor = "bg-yellow-500";
      let statusIcon = "\u2139\uFE0F";
      let pulseRing = "";
      if (status === "reported") {
        markerColor = "bg-amber-500";
        statusIcon = `<span class="text-xs text-white font-bold">${reportCount}</span>`;
      } else if (status === "verified") {
        markerColor = "bg-orange-600";
        statusIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.166 11.37c1.37.533 2.91.472 4.234-.171 1.25-.606 2.65-.67 3.94-.183l4.76 1.792a2 2 0 002.5-1.5l1.1-4.8a2 2 0 00-1.5-2.4l-4.76-1.792a2 2 0 00-2.5 1.5L8.84 8.63a2 2 0 01-2.5 1.5l-4.174-1.62c-.63-.245-1.166.257-1.166.93v2.33z" clip-rule="evenodd" /></svg>`;
      } else if (status === "pending_fix_confirmation") {
        markerColor = "bg-purple-600";
        statusIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white animate-pulse" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>`;
        pulseRing = "animate-pulse-ring";
      } else if (status === "resolved") {
        markerColor = "bg-emerald-600";
        statusIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
      }
      let catIcon = "\u{1F4CD}";
      if (category.includes("Road")) catIcon = "\u{1F6E3}\uFE0F";
      else if (category.includes("Garbage")) catIcon = "\u{1F5D1}\uFE0F";
      else if (category.includes("Light")) catIcon = "\u{1F4A1}";
      else if (category.includes("Sewage")) catIcon = "\u{1F4A7}";
      const htmlContent = `
        <div class="relative flex flex-col items-center">
          <div class="absolute -top-7 bg-slate-900/90 text-white text-[10px] font-sans px-1 py-0.5 rounded shadow border border-slate-700/50 flex items-center gap-1">
            <span>${catIcon}</span>
            <span class="font-semibold">${reportCount} reps</span>
          </div>
          <div class="flex items-center justify-center h-8 w-8 rounded-full ${markerColor} ${pulseRing} text-white border-2 ${isSelected ? "border-white scale-125 z-50 ring-4 ring-indigo-400" : "border-slate-800 shadow-lg"} transition-transform duration-200">
            ${statusIcon}
          </div>
        </div>
      `;
      const customIcon = L.divIcon({
        html: htmlContent,
        className: `custom-issue-marker-${issue.id}`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      if (markersRef.current[issue.id]) {
        markersRef.current[issue.id].setLatLng([issue.lat, issue.lng]);
        markersRef.current[issue.id].setIcon(customIcon);
      } else {
        const marker = L.marker([issue.lat, issue.lng], { icon: customIcon }).addTo(map).on("click", () => {
          onSelectIssue(issue.id);
        });
        markersRef.current[issue.id] = marker;
      }
    });
  }, [issues, selectedIssueId]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    hotspotLayersRef.current.forEach((layer) => layer.remove());
    hotspotLayersRef.current = [];
    if (!showHotspots) return;
    hotspots.forEach((spot) => {
      const halfSize = 1e-3;
      const bounds = [
        [spot.lat - halfSize, spot.lng - halfSize],
        [spot.lat + halfSize, spot.lng + halfSize]
      ];
      const color = spot.isWatchZone ? "#ef4444" : "#f59e0b";
      const fillColor = spot.isWatchZone ? "#fee2e2" : "#fef3c7";
      const rect = L.rectangle(bounds, {
        color,
        weight: spot.isWatchZone ? 3 : 1.5,
        fillColor,
        fillOpacity: spot.isWatchZone ? 0.45 : 0.25,
        dashArray: spot.isWatchZone ? "4, 4" : void 0
      }).addTo(map);
      const label = spot.isWatchZone ? `\u{1F525} <strong>WATCH ZONE FLAGGED</strong><br/>Growth Rate: <span class="text-rose-400 font-mono font-bold">+${Math.round(spot.growthRate * 100)}%</span> week-over-week<br/>Active Reports: <span class="font-mono font-bold">${spot.totalCount}</span>` : `\u26A0\uFE0F <strong>High Activity</strong><br/>Reports: ${spot.totalCount} total<br/>Growth Rate: ${Math.round(spot.growthRate * 100)}%`;
      rect.bindTooltip(label, { sticky: true, className: "bg-slate-900 border border-slate-700 text-slate-100 font-sans text-xs rounded p-2" });
      hotspotLayersRef.current.push(rect);
    });
  }, [hotspots, showHotspots]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;
    const selectedIssue = issues.find((i) => i.id === selectedIssueId);
    if (selectedIssue) {
      map.setView([selectedIssue.lat, selectedIssue.lng], 16, { animate: true });
    }
  }, [selectedIssueId, issues]);
  return <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full" id="nagar-leaflet-map" />
      
      {
    /* Visual map legend overlay */
  }
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/50 p-3.5 rounded-xl shadow-lg max-w-xs font-sans text-xs space-y-2">
        <h4 className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-1.5">
          <span>🗺️</span> Map Legend
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm inline-block" />
            <span className="text-slate-300">Reported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-sm inline-block animate-pulse" />
            <span className="text-slate-300">Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-sm inline-block ring-2 ring-purple-300 ring-offset-1 ring-offset-slate-900" />
            <span className="text-slate-300 font-medium text-purple-300">Pending Fix</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm inline-block" />
            <span className="text-slate-300">Resolved</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 mt-1">
          💡 Click anywhere on the map to drop a pin and report an issue.
        </p>
      </div>
    </div>;
}
