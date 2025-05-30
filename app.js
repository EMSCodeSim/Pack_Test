let startTime, watchId;
let totalDistance = 0;
let lapCount = 0;
let previousCoords = null;
let goalTime = 45;
const totalDistanceGoal = 3.0;
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
  paceSamples = [];
  previousCoords = null;
  startTime = Date.now();
  timerRunning = true;
  updateTimer();

  watchId = navigator.geolocation.watchPosition(updatePosition, showError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 5000,
  });

  if (!window.mapInitialized) {
    const map = L.map('map').setView([0, 0], 17);
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
    const d = getDistanceFromLatLonInMi(previousCoords.latitude, previousCoords.longitude, latitude, longitude);
    if (d < 0.0019) return; // ignore small drift under 10 feet
    totalDistance += d;
    if (totalDistance >= (lapCount + 1) * 0.25) lapCount++;
  }

  previousCoords = { latitude, longitude };

  // Update map
  if (window.map) {
    const latlng = [latitude, longitude];
    window.map.setView(latlng);
    if (!window.userMarker) {
      window.userMarker = L.marker(latlng).addTo(window.map);
    } else {
      window.userMarker.setLatLng(latlng);
    }
  }

  // Update visuals after 0.02 mi
  if (totalDistance < 0.02) return;

  const elapsedMin = (Date.now() - startTime) / 60000;
  let pace;

  if (speed && speed > 0) {
    pace = 26.8224 / speed; // m/s to min/mile
  } else {
    pace = elapsedMin / totalDistance;
  }

  paceSamples.push(pace);
  if (paceSamples.length > 5) paceSamples.shift();
  const avgPace = paceSamples.reduce((a, b) => a + b, 0) / paceSamples.length;
  paceEl.textContent = avgPace.toFixed(2);

  const estFinish = avgPace * totalDistanceGoal;
  const estMin = Math.floor(estFinish);
  const estSec = Math.floor((estFinish % 1) * 60);
  estimateText.textContent = `Est. Finish: ${estMin}:${String(estSec).padStart(2, "0")}`;

  const deviation = (estFinish - goalTime) / goalTime;
  const leftPercent = Math.min(100, Math.max(0, 50 + deviation * 50));
  progressIcon.style.left = `${leftPercent}%`;

  lapsEl.textContent = lapCount;
  distanceLabel.textContent = `${totalDistance.toFixed(2)} / 3.00`;
  lapLabel.textContent = `${lapCount} / 12 laps`;
  distanceBar.style.width = `${Math.min(100, (totalDistance / 3) * 100)}%`;
  lapBar.style.width = `${Math.min(100, (lapCount / 12) * 100)}%`;
}

function showError(err) {
  alert("GPS Error: " + err.message);
}

function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
