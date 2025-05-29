
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

startBtn.onclick = () => {
  startTime = Date.now();
  totalDistance = 0;
  lastPosition = null;
  updateTime();
  watchId = navigator.geolocation.watchPosition(updatePosition, console.error, { enableHighAccuracy: true });
  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  navigator.geolocation.clearWatch(watchId);
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

function updateTime() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  timeEl.textContent = \`\${mins}:\${secs}\`;

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

  const elapsed = (currentTime - startTime) / 1000 / 60;
  const pace = totalDistance > 0 ? (elapsed / totalDistance).toFixed(2) : "--";
  paceEl.textContent = pace;

  const estimate = totalDistance > 0 ? (3 * (elapsed / totalDistance)) : 0;
  const estMins = Math.floor(estimate).toString().padStart(2, '0');
  const estSecs = Math.floor((estimate % 1) * 60).toString().padStart(2, '0');
  estimateEl.textContent = totalDistance > 0 ? \`\${estMins}:\${estSecs}\` : "--:--";
}

function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
