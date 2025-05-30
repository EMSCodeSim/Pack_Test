let watchID, startTime, laps = 0, distance = 0, positions = [];
let isRunning = false;

const lapLength = 0.25;
const totalLaps = 12;
const totalDistance = 3;
const trackCenterX = 200;
const trackCenterY = 100;
const trackRadiusX = 180;
const trackRadiusY = 80;

const toggleBtn = document.getElementById('toggleBtn');
const timeDisplay = document.getElementById('time');
const paceDisplay = document.getElementById('pace');
const runnerDot = document.getElementById('runnerDot');
const estFinish = document.getElementById('estFinish');
const pacerRunner = document.getElementById('pacerRunner');
const targetTimeInput = document.getElementById('targetTime');
const distanceFill = document.getElementById('distanceFill');
const distanceText = document.getElementById('distanceText');
const lapFill = document.getElementById('lapFill');
const lapText = document.getElementById('lapText');

toggleBtn.onclick = () => {
  if (!isRunning) {
    // Start test
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device.");
      return;
    }

    // Permission check (some iOS versions)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          alert("Location access is denied. Enable it in Settings > Safari > Location.");
        }
      });
    }

    startTime = Date.now();
    distance = 0;
    laps = 0;
    positions = [];
    isRunning = true;
    toggleBtn.textContent = "Stop Test";

    watchID = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        isRunning = false;
        toggleBtn.textContent = "Start Test";
        alert("Geolocation error: " + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );

    updateTimer();
  } else {
    // Stop test
    navigator.geolocation.clearWatch(watchID);
    isRunning = false;
    toggleBtn.textContent = "Start Test";
  }
};

function updateTimer() {
  const interval = setInterval(() => {
    if (!isRunning) return clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timeDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function handlePosition(pos) {
  const { latitude, longitude } = pos.coords;
  const point = { lat: latitude, lon: longitude, time: Date.now() };
  positions.push(point);

  if (positions.length > 5) {
    const last5 = positions.slice(-5);
    const d = calcDistance(last5[0], last5[4]);
    if (d > 0.005) distance += d;
  }

  laps = Math.floor(distance / lapLength);
  if (laps > totalLaps) laps = totalLaps;

  const elapsedMin = (Date.now() - startTime) / 60000;
  const pace = elapsedMin > 0 ? distance / elapsedMin : 0;
  paceDisplay.textContent = pace > 0 ? (60 / pace).toFixed(2) : "0:00";

  const estTime = pace > 0 ? (totalDistance / pace).toFixed(2) : "--";
  estFinish.textContent = estTime !== "--"
    ? `${Math.floor(estTime)}:${String(Math.round((estTime % 1) * 60)).padStart(2, '0')}`
    : "--:--";

  updateRunnerDot(distance / (lapLength * totalLaps));
  updateProgressBars(distance, laps);

  const targetTimeMin = parseFloat(targetTimeInput.value);
  const expectedRatio = elapsedMin / targetTimeMin;
  const actualRatio = distance / totalDistance;
  const offsetRatio = actualRatio - expectedRatio;
  updatePacerRunner(offsetRatio);
}

function updateRunnerDot(progress) {
  const angle = progress * 2 * Math.PI;
  const x = trackCenterX + trackRadiusX * Math.cos(angle - Math.PI / 2);
  const y = trackCenterY + trackRadiusY * Math.sin(angle - Math.PI / 2);
  runnerDot.setAttribute('cx', x);
  runnerDot.setAttribute('cy', y);
}

function updatePacerRunner(offset) {
  const maxShift = 150;
  let shiftPx = offset * maxShift;
  shiftPx = Math.max(-maxShift, Math.min(maxShift, shiftPx));
  pacerRunner.style.left = `calc(50% + ${shiftPx}px)`;
}

function updateProgressBars(dist, laps) {
  const distRatio = Math.min(dist / totalDistance, 1);
  const lapRatio = Math.min(laps / totalLaps, 1);

  distanceFill.style.width = `${distRatio * 100}%`;
  distanceText.textContent = `${dist.toFixed(2)} / 3.00 mi`;

  lapFill.style.width = `${lapRatio * 100}%`;
  lapText.textContent = `${laps} / 12 Laps`;
}

function calcDistance(p1, p2) {
  const R = 3958.8;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
