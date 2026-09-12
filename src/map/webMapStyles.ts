// src/map/webMapStyles.ts
// All CSS injected into the WebView.
// One file, one job — styling only.

export const webMapStyles = `
  html, body, #map {
    width: 100%; height: 100%;
    margin: 0; padding: 0;
    background: #0F172A;
  }

  /* ── Bus marker ─────────────────────────────── */
  @keyframes pulse {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(2.5); opacity: 0;    }
  }
  .pulse-ring {
    position: absolute;
    width: 62px; height: 62px;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.18);
    animation: pulse 2s infinite;
    filter: blur(1px);
    z-index: 1;
  }
  #bus-container {
    position: relative;
    width: 64px; height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #bus-body {
    width: 46px; height: 46px;
    background: #2563EB;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.45);
    border: 4px solid white;
    z-index: 5;
    transition: transform 0.5s linear;
  }
  #bus-body svg { width: 26px; height: 26px; }
  .bus-shadow {
    position: absolute;
    bottom: 6px; left: 50%;
    transform: translateX(-50%);
    width: 30px; height: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    filter: blur(8px);
    z-index: 0;
  }

  /* ── Progress overlay ───────────────────────── */
  #progress-overlay {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(15, 23, 42, 0.92);
    padding: 10px 16px 14px;
    z-index: 1000;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    display: none;
  }
  #progress-overlay.visible { display: block; }
  #progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #94A3B8;
    margin-bottom: 6px;
    font-family: sans-serif;
  }
  #progress-track {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  #progress-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, #6366F1, #10B981);
    border-radius: 3px;
    transition: width 0.6s ease;
  }
  #progress-pct {
    text-align: center;
    color: #F8FAFC;
    font-size: 12px;
    font-weight: 700;
    margin-top: 5px;
    font-family: sans-serif;
  }
`;
