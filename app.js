let startTime, timerInterval, watchId;
let totalDistance = 0;
let lastPos = null;
let lapCount = 0;

const goalTimeInput = document.getElementById('goalTime');
const timeDisplay = document.getElementById('time');
const paceDisplay = document.getElementById('pace');
const lapsDisplay = document.getElementById('laps');
const distanceLabel = document.getElementById('distance-label');
const distanceBar = document.getElementById('distance-bar-fill');
const lapLabel = document.getElementById('lap-label');
const lapBar = document.getElementById('lap-bar-fill');
const estimateText = document.getElementById('estimate-text');
const runnerDot = document.getElementById('runnerDot');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

function formatTime(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function updateTimer() {
  const now = Date.now();
  const elapsed = now - startTime;
  timeDisplay.textContent = formatTime(elapsed);

  const pace = totalDistance > 0 ? elapsed / 60000 / totalDistance : 0;
  paceDisplay.textContent = pace.toFixed(2);

  const estFinishMin = pace * 3; // 3 miles target
  estimateText.textContent = `Est. Finish: ${Math.floor(estFinishMin)}:${Math.round((estFinishMin % 1) * 60).toString().padStart(2, '0')}`;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateRunnerDot() {
  const pct = (totalDistance / 3) % 1;
  const angle = 2 * Math.PI * pct - Math.PI / 2;
  const cx = 100 + 90 * Math.cos(angle);
  const cy = 50 + 40 * Math.sin(angle);
  runnerDot.setAttribute("cx", cx);
  runnerDot.setAttribute("cy", cy);
}

function updateDistanceUI() {
  distanceLabel.textContent = `${totalDistance.toFixed(2)} / 3.00 miles`;
  distanceBar.style.width = `${(totalDistance / 3) * 100}%`;

  lapLabel.textContent = `${lapCount} / 12 laps`;
  lapBar.style.width = `${(lapCount / 12) * 100}%`;

  updateRunnerDot();
}

function updatePosition(pos) {
  const { latitude, longitude } = pos.coords;
  if (lastPos) {
    const dist = getDistance(lastPos.lat, lastPos.lon, latitude, longitude);
    if (dist > 0.0001) { // filter GPS jitter
      totalDistance += dist;
      lapCount = Math.floor(totalDistance / 0.25);
      updateDistanceUI();
    }
  }
  lastPos = { lat: latitude, lon: longitude };
}

startBtn.onclick = () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  totalDistance = 0;
  lapCount = 0;
  lastPos = null;
  updateDistanceUI();

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  watchId = navigator.geolocation.watchPosition(updatePosition, (err) => {
    alert("GPS error: " + err.message);
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
};

stopBtn.onclick = () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearInterval(timerInterval);
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};
