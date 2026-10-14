// src/map/animationEngine.ts


export function animationEngineJs(
  pickupLat: number,
  pickupLng: number
): string {
  return `
    var animStart = null;
    var animDuration = 700;
    var fromLat = busLat;
    var fromLng = busLng;
    var targetLat = busLat;
    var targetLng = busLng;

    function animateBus(timestamp) {
      if (!busMarker) return;

      if (animStart === null) {
        animStart = timestamp;
      }

      var t = Math.min(
        (timestamp - animStart) / animDuration,
        1
      );

      t = 1 - Math.pow(1 - t, 3);

      busMarker.setLatLng([
        fromLat + (targetLat - fromLat) * t,
        fromLng + (targetLng - fromLng) * t
      ]);

      if (t < 1) {
        requestAnimationFrame(animateBus);
      } else {
        fromLat = targetLat;
        fromLng = targetLng;
        animStart = null;
      }
    }

    function rotateBus(heading) {
      var busBody = document.getElementById("bus-body");

      if (!busBody || !Number.isFinite(heading)) return;

      busBody.style.transform =
        "rotate(" + heading + "deg)";
    }

    function updateCamera(lat, lng) {
      if (!map) return;

      var safeBounds = map.getBounds().pad(-0.25);

      if (!safeBounds.contains(L.latLng(lat, lng))) {
        map.panTo([lat, lng], {
          animate: true,
          duration: 0.6
        });
      }
    }

    window.smoothMoveBus = function(
      lat,
      lng,
      heading,
      speed
    ) {
      if (
        !busMarker ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        console.log("INVALID BUS LOCATION");
        return;
      }

      var currentPos = busMarker.getLatLng();

      fromLat = currentPos.lat;
      fromLng = currentPos.lng;
      targetLat = lat;
      targetLng = lng;
      animStart = null;

      rotateBus(heading);
      requestAnimationFrame(animateBus);
// Update the blue route on every valid GPS update.
if (typeof window.updateRouteProgress === "function") {
  window.updateRouteProgress(lat, lng);
}

if (speed > 3) {
  updateCamera(lat, lng);
}
    };

    window.updateDriverPosition =
      window.smoothMoveBus;

    window.updateProgressBar = function(pct) {
      var fill = document.getElementById("progress-fill");
      var label = document.getElementById("progress-pct");

      if (fill) {
        fill.style.width = pct + "%";
      }

      if (label) {
        label.textContent =
          pct + "% of route completed";
      }
    };
  `;
}
