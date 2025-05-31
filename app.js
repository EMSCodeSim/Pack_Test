let watchId;
let startTime;
let totalDistance = 0;
let lastPosition = null;

const distanceEl = document.getElementById("distance");
const timeEl = document.getElementById("time");
const paceEl = document.getElementById("pace");
const estimateEl = document.getElementById("estimate");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.addEventListener("click", startTest);
stopBtn.addEventListener("click", stopTest);

function startTest() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  startTime = Date.now();
  totalDistance = 0;
  lastPosition = null;
  updateTime();
  watchId = navigator.geolocation.watchPosition(updatePosition, (err) => {
    alert("Location access denied or error: " + err.message);
  }, { enableHighAccuracy: true });
  startBtn.disabled = true;
  stopBtn.disabled = false;
}

function stopTest() {
  navigator.geolocation.clearWatch(watchId);
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function updateTime() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  timeEl.textContent = `${mins}:${secs}`;

  if (startBtn.disabled) setTimeout(updateTime, 1000);
}

function updatePosition(pos) {
  const { latitude, longitude } = pos.coords;
  const currentTime = Date.now();

  if (lastPosition) {
    const d = getDistanceFromLatLonInMi(latitude, longitude, lastPosition.lat, lastPosition.lon);
    totalDistance += d;
  }

  lastPosition = { lat: latitude, lon: longitude };

  distanceEl.textContent = totalDistance.toFixed(2);
  const elapsedMinutes = (Date.now() - startTime) / 60000;
  if (totalDistance > 0) {
    const pace = elapsedMinutes / totalDistance;
    paceEl.textContent = pace.toFixed(2);
    const estFinish = pace * 3; // for 3 miles
    const mins = Math.floor(estFinish).toString().padStart(2, '0');
    const secs = Math.floor((estFinish % 1) * 60).toString().padStart(2, '0');
    estimateEl.textContent = `${mins}:${secs}`;
  }
}

function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
