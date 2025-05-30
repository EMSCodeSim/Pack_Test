let watchID, startTime, laps = 0, distance = 0, positions = [];

const lapLength = 0.25; // 1 lap = 0.25 mi
const totalLaps = 12;
const trackCenterX = 200;
const trackCenterY = 100;
const trackRadiusX = 180;
const trackRadiusY = 80;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const lapCount = document.getElementById('lapCount');
const timeDisplay = document.getElementById('time');
const paceDisplay = document.getElementById('pace');
const runnerDot = document.getElementById('runnerDot');

startBtn.onclick = () => {
  startTime = Date.now();
  distance = 0;
  laps = 0;
  positions = [];
  startBtn.disabled = true;
  stopBtn.disabled = false;
  lapCount.textContent = "0";

  watchID = navigator.geolocation.watchPosition(handlePosition, console.error, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000
  });

  updateTimer();
};

stopBtn.onclick = () => {
  navigator.geolocation.clearWatch(watchID);
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

function updateTimer() {
  const interval = setInterval(() => {
    if (!startBtn.disabled) return clearInterval(interval);
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
  lapCount.textContent = laps;

  const elapsedMin = (Date.now() - startTime) / 60000;
  const pace = elapsedMin > 0 ? distance / elapsedMin : 0;
  paceDisplay.textContent = pace > 0 ? (60 / pace).toFixed(2) : "0:00";

  updateRunnerDot(distance / (lapLength * totalLaps));
}

function updateRunnerDot(progress) {
  const angle = progress * 2 * Math.PI;
  const x = trackCenterX + trackRadiusX * Math.cos(angle - Math.PI / 2);
  const y = trackCenterY + trackRadiusY * Math.sin(angle - Math.PI / 2);
  runnerDot.setAttribute('cx', x);
  runnerDot.setAttribute('cy', y);
}

function calcDistance(p1, p2) {
  const R = 3958.8;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
