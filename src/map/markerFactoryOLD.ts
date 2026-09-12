console.log("✅ markerFactory.ts loaded");
export const markerFactory = `


/* ===============================
   BUS MARKER
================================ */

var busIcon = L.divIcon({
  className: '',
  html: \`
    <div id="bus-container">

      <div class="pulse-ring"></div>

      <div class="bus-shadow"></div>

      <div id="bus-body">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">

          <rect
            x="4"
            y="5"
            width="16"
            height="11"
            rx="3"
            fill="white"/>

          <rect
            x="6"
            y="7"
            width="12"
            height="4"
            rx="1"
            fill="#2563EB"/>

          <circle
            cx="8"
            cy="18"
            r="2"
            fill="white"/>

          <circle
            cx="16"
            cy="18"
            r="2"
            fill="white"/>

        </svg>
      </div>

    </div>
  \`,
  iconSize:[64,64],
  iconAnchor:[32,32]
});


/* ===============================
   PICKUP MARKER
================================ */

var pickupIcon = L.divIcon({
  className:'',
  html:\`
    <div class="pickup-marker">

      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="white">

        <path
          d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z"/>

      </svg>

    </div>
  \`,
  iconSize:[44,44],
  iconAnchor:[22,44]
});


/* ===============================
   SCHOOL MARKER
================================ */

var schoolIcon = L.divIcon({
  className:'',
  html:\`
    <div class="school-marker">

      🎓

    </div>
  \`,
  iconSize:[44,44],
  iconAnchor:[22,44]
});


/* ===============================
   STOP MARKER
================================ */

function makeStopIcon(name){

  return L.divIcon({

    className:'',

    html:\`
      <div class="stop-marker">

        🚏

      </div>
    \`,

    iconSize:[36,36],

    iconAnchor:[18,36]

  });

}
`;