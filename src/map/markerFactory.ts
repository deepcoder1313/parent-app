// src/map/markerFactory.ts
// Returns raw JS string that defines all Leaflet icons.
// Injected once into the WebView — no import/escape issues.

export function markerFactoryJs(): string {
  return `
  // ── Bus icon ──────────────────────────────────────────
  var busIcon = L.divIcon({
    className: "",
    html:
      '<div id="bus-container">' +
        '<div class="pulse-ring"></div>' +
        '<div class="bus-shadow"></div>' +
        '<div id="bus-body">' +
          '<svg width="34" height="34" viewBox="0 0 24 24" fill="none">' +
            '<rect x="4" y="5" width="16" height="11" rx="3" fill="white"/>' +
            '<rect x="6" y="7" width="12" height="4" rx="1" fill="#2563EB"/>' +
            '<circle cx="8" cy="18" r="2" fill="white"/>' +
            '<circle cx="16" cy="18" r="2" fill="white"/>' +
          '</svg>' +
        '</div>' +
      '</div>',
    iconSize:   [64, 64],
    iconAnchor: [32, 32],
  });

  // ── Pickup icon ───────────────────────────────────────
  var pickupIcon = L.divIcon({
    className: "",
    html:
      '<div style="width:44px;height:44px;border-radius:50%;background:#10B981;' +
      'display:flex;justify-content:center;align-items:center;' +
      'border:3px solid white;box-shadow:0 8px 20px rgba(16,185,129,.45);">' +
        '<svg width="18" height="18" viewBox="0 0 24 24">' +
          '<path fill="white" d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z"/>' +
        '</svg>' +
      '</div>',
    iconSize:   [42, 42],
    iconAnchor: [21, 42],
  });

  // ── School icon ───────────────────────────────────────
  var schoolIcon = L.divIcon({
    className: "",
    html:
      '<div style="background:#F59E0B;width:42px;height:42px;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;font-size:20px;' +
      'box-shadow:0 4px 14px rgba(245,158,11,0.55);border:3px solid white;">🎓</div>',
    iconSize:   [42, 42],
    iconAnchor: [21, 42],
  });

  // ── Stop icon factory ────────────────────────────────
  function makeStopIcon() {
    return L.divIcon({
      className: "",
      html:
        '<div style="background:#334155;width:34px;height:34px;border-radius:50%;' +
        'display:flex;align-items:center;justify-content:center;font-size:16px;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid #64748B;">🚏</div>',
      iconSize:   [34, 34],
      iconAnchor: [17, 34],
    });
  }
  `;
}
