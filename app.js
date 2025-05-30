let startTime, watchId;
let totalDistance = 0;
let lapCount = 0;
let previousCoords = null;
let goalTime = 45;
const totalDistanceGoal = 3.0;
const totalLaps = 12;
let paceSamples = [];
let timerRunning = false;

const timeEl = document.getElementById("time");
const paceEl = document.getElementById("pace");
const lapsEl = document.getElementById("laps");
const distanceLabel = document.getElementById("distance-label");
const lapLabel = document.getElementById("lap-label");
const distanceBar = document.getElementById("distance-bar-fill");
const lapBar = document.getElementById("lap-bar-fill");
const progressIcon = document.getElementById("progress-icon");
const estimateText = document.getElementById("estimate-text");

document.getElementById("startBtn").addEventListener("click", startTest);
document.getElementById("stopBtn").addEventListener("click", stopTest);

function startTest() {
  goalTime = parseFloat(document.getElementById("goalTime").value) || 45;
  totalDistance = 0;
  lapCount = 0;
  previousCoords = null;
  paceSamples = [];
  startTime = Date.now();
  timerRunning = true;
  updateTimer();
  watchId = navigator.geolocation.watchPosition(updatePosition, showError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 5000,
  });

  // Map setup
  if (!window.mapInitialized) {
    const map = L.map('map').setView([0, 0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    window.map = map;
    window.mapInitialized = true;
  }

  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;
}

function stopTest() {
  navigator.geolocation.clearWatch(watchId);
  timerRunning = false;
  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
}

function updateTimer() {
  if (!timerRunning) return;
  const elapsed = (Date.now() - startTime) / 1000;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  timeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  setTimeout(updateTimer, 1000);
}

function updatePosition(pos) {
  const { latitude, longitude, speed } = pos.coords;

  if (previousCoords) {
    const distance = getDistanceFromLatLonInMi(
      previousCoords.latitude,
      previousCoords.longitude,
      latitude,
      longitude
    );
    if (distance < 0.0019) return; // ~10 feet, ignore small drift
    totalDistance += distance;
    if (totalDistance >= (lapCount + 1) * 0.25) lapCount++;
  }

  previousCoords = { latitude, longitude };

  // Map
  if (window.map) {
    window.map.setView([latitude, longitude]);
    if (!window.userMarker) {
      window.userMarker = L.marker([latitude, longitude]).addTo(window.map);
    } else {
      window.userMarker.setLatLng([latitude, longitude]);
    }
  }

  // Time and pace
  const elapsedMin = (Date.now() - startTime) / 1000 / 60;

  let currentPace;
  if (speed && speed > 0) {
    // speed in m/s → pace in min/mile
    currentPace = 26.8224 / speed;
  } else {
    currentPace = totalDistance > 0 ? elapsedMin / totalDistance : 0;
  }

  // Smooth pace over 5 samples
  paceSamples.push(currentPace);
  if (paceSamples.length > 5) paceSamples.shift();
  const avgPace = paceSamples.reduce((a, b) => a + b, 0) / paceSamples.length;
  paceEl.textContent = avgPace.toFixed(2);

  const estFinish = avgPace * totalDistanceGoal;
  const estMin = Math.floor(estFinish);
  const estSec = Math.floor((estFinish % 1) * 60);
  estimateText.textContent = `Est. Finish: ${estMin}:${String(estSec).padStart(2, "0")}`;

  // Pacer dot logic (right of center = ahead)
  const goalCenter = 50;
  const deviation = (estFinish - goalTime) / goalTime;
  const positionOffset = deviation * 50;
  const leftPercent = Math.min(100, Math.max(0, goalCenter + positionOffset));
  progressIcon.style.left = `${leftPercent}%`;

  // Progress bars
  distanceLabel.textContent = `${totalDistance.toFixed(2)} / 3.00 miles`;
  lapLabel.textContent = `${lapCount} / 12 laps`;
  lapsEl.textContent = `${lapCount}`;
  distanceBar.style.width = `${Math.min(100, (totalDistance / 3) * 100)}%`;
  lapBar.style.width = `${Math.min(100, (lapCount / 12) * 100)}%`;
}

function showError(err) {
  alert("GPS error: " + err.message);
}

// Haversine
function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
