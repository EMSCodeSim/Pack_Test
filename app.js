let watchID, startTime, laps = 0, distance = 0, positions = [], isRunning = false;

const totalLaps = 12;
const lapLength = 0.25;
const totalDistance = 3.0;

const startBtn = document.getElementById("startBtn");
const timeDisplay = document.getElementById("time");
const distanceDisplay = document.getElementById("distance");
const lapsDisplay = document.getElementById("laps");
const runnerDot = document.getElementById("runnerDot");
const estFinish = document.getElementById("estFinish");

const centerX = 200;
const centerY = 100;
const radiusX = 180;
const radiusY = 80;
const targetTimeSec = 2700; // 45 min

startBtn.addEventListener("click", () => {
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

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  watchID = navigator.geolocation.watchPosition(
    updatePosition,
    (err) => alert("Location error: " + err.message),
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
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    timeDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function updatePosition(pos) {
  const { latitude, longitude } = pos.coords;
  const newPoint = { lat: latitude, lon: longitude };
  positions.push(newPoint);

  if (positions.length > 5) {
    const d = calcDistance(positions[positions.length - 5], newPoint);
    if (d > 0.001) distance += d;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const estFinishTime = distance > 0 ? (elapsed * (totalDistance / distance)) : 2700;
  const estMins = String(Math.floor(estFinishTime / 60)).padStart(2, "0");
  const estSecs = String(Math.floor(estFinishTime % 60)).padStart(2, "0");

  distanceDisplay.textContent = distance.toFixed(2);
  laps = Math.floor(distance / lapLength);
  lapsDisplay.textContent = laps > totalLaps ? totalLaps : laps;
  estFinish.textContent = `${estMins}:${estSecs}`;

  updateRunnerDot(distance / totalDistance);
}

function updateRunnerDot(progress) {
  const angle = progress * 2 * Math.PI;
  const x = centerX + radiusX * Math.cos(angle - Math.PI / 2);
  const y = centerY + radiusY * Math.sin(angle - Math.PI / 2);
  runnerDot.setAttribute("cx", x);
  runnerDot.setAttribute("cy", y);
}

function calcDistance(p1, p2) {
  const R = 3958.8; // mi
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
