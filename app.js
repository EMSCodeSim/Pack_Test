let watchID, startTime, laps = 0, distance = 0, positions = [], isRunning = false;

const lapLength = 0.25;
const totalLaps = 12;
const totalDistance = 3;
const trackCenterX = 200;
const trackCenterY = 100;
const trackRadiusX = 180;
const trackRadiusY = 80;
const targetTime = 45 * 60; // 45 minutes

const startBtn = document.getElementById('startBtn');
const timeDisplay = document.getElementById('time');
const distanceDisplay = document.getElementById('distance');
const paceDisplay = document.getElementById('pace');
const runnerDot = document.getElementById('runnerDot');
const pacerRunner = document.getElementById('pacerRunner');
const estFinish = document.getElementById('estFinish');
const progressFill = document.getElementById('distanceProgress');
const progressText = document.getElementById('progressText');

startBtn.addEventListener('click', () => {
  if (!isRunning) {
    startTracking();
    startBtn.textContent = "Stop";
  } else {
    stopTracking();
    startBtn.textContent = "Start";
  }
  isRunning = !isRunning;
});

function startTracking() {
  startTime = Date.now();
  distance = 0;
  laps = 0;
  positions = [];

  watchID = navigator.geolocation.watchPosition(
    updatePosition,
    (err) => alert("GPS error: " + err.message),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );

  updateTimer();
}

function stopTracking() {
  navigator.geolocation.clearWatch(watchID);
}

function updateTimer() {
  const interval = setInterval(() => {
    if (!isRunning) return clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timeDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function updatePosition(pos) {
  const { latitude, longitude } = pos.coords;
  const point = { lat: latitude, lon: longitude };
  positions.push(point);

  if (positions.length > 5) {
    const d = calcDistance(positions[positions.length - 5], point);
    if (d > 0.001) distance += d;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const speed = distance / (elapsed / 3600);
  const estFinishSec = distance === 0 ? targetTime : (targetTime * (totalDistance / distance));
  const estMin = Math.floor(estFinishSec / 60);
  const estSec = String(Math.floor(estFinishSec % 60)).padStart(2, '0');

  paceDisplay.textContent = speed.toFixed(2);
  distanceDisplay.textContent = distance.toFixed(2);
  estFinish.textContent = `${estMin}:${estSec}`;
  laps = Math.floor(distance / lapLength);

  const progressPercent = Math.min((distance / totalDistance) * 100, 100);
  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `${distance.toFixed(2)} / 3 miles | ${laps} / 12 laps`;

  updateRunnerDot(distance / totalDistance);
  updatePacerDot(elapsed / targetTime);
}

function updateRunnerDot(progress) {
  const angle = progress * 2 * Math.PI;
  const x = trackCenterX + trackRadiusX * Math.cos(angle - Math.PI / 2);
  const y = trackCenterY + trackRadiusY * Math.sin(angle - Math.PI / 2);
  runnerDot.setAttribute('cx', x);
  runnerDot.setAttribute('cy', y);
}

function updatePacerDot(progress) {
  const angle = progress * 2 * Math.PI;
  const x = trackCenterX + trackRadiusX * Math.cos(angle - Math.PI / 2);
  const y = trackCenterY + trackRadiusY * Math.sin(angle - Math.PI / 2);
  pacerRunner.setAttribute('cx', x);
  pacerRunner.setAttribute('cy', y);
}

function calcDistance(p1, p2) {
  const R = 3958.8; // miles
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
