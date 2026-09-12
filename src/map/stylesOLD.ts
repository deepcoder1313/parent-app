 console.log("✅ styles.ts loaded");

 export const mapStyles = `html, body, #map {

 
  margin: 0;
  padding: 0;
  height: 100%;
}
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}
#map {
  position: absolute;
  inset: 0;
}
#progress-overlay {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
  z-index: 1000;
}
#progress-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}
#progress-labels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 10px;
}
#progress-track {
  width: 100%;
  height: 10px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
}
#progress-fill {
  width: 0%;
  height: 100%;
  background: #22c55e;
  transition: width 180ms ease;
}
#progress-pct {
  margin-top: 10px;
  color: #cbd5e1;
  font-size: 12px;
}
`;


