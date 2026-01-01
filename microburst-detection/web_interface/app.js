

// ========================================
// AMARR-STORMOMON DASHBOARD - app.js
// Microburst Detection System Interface
// With Continental Filtering Support
// ========================================


const AIRPORTS_WORLDWIDE = [
  { id:'bhx', name:'Birmingham', continent:'Europe', lat:52.453, lon:-1.748, country:'UK' },
  { id:'gru', name:'Sao Paulo', continent:'America', lat:-23.435, lon:-46.473, country:'Brazil' },
  { id:'lax', name:'Los Angeles', continent:'America', lat:33.9416, lon:-118.4085, country:'USA' },
  { id:'nrt', name:'Tokyo Narita', continent:'Asia', lat:35.772, lon:140.392, country:'Japan' },
  { id:'jnb', name:'Johannesburg', continent:'Africa', lat:-26.133, lon:28.242, country:'South Africa' },
  { id:'syd', name:'Sydney', continent:'Oceania', lat:-33.9399, lon:151.1753, country:'Australia' },
  { id:'tnr', name:'Antananarivo', continent:'Africa', lat:-18.7969, lon:47.4788, country:'Madagascar' },
  { id:'mcm', name:'McMurdo Station', continent:'Antarctica', lat:-77.8419, lon:166.6863, country:'Antarctica' }
];


// Coordenadas y zoom recomendados por continente
const CONTINENT_VIEWS = {
  America: { lat: 20, lon: -80, zoom: 3 },    // Centro América
  Europe: { lat: 54, lon: 15, zoom: 4 },      // Centro Europa
  Asia: { lat: 40, lon: 100, zoom: 3 },       // Centro Asia
  Africa: { lat: 1, lon: 21, zoom: 3 },       // Centro África
  Oceania: { lat: -25, lon: 134, zoom: 4 },   // Centro Australia
  Antarctica: { lat: -78, lon: 0, zoom: 3 },  // Centro Antártida
  all: { lat: 20, lon: 0, zoom: 2 }           // Vista global
};

function flyToContinent(continent) {
  const view = CONTINENT_VIEWS[continent] || CONTINENT_VIEWS["all"];
  if (state.map) {
    state.map.flyTo([view.lat, view.lon], view.zoom, { animate: true, duration: 1.2 });
  }
}


// Helper para asignar continente según lat/lon (aproximado)
function getContinentByCoords(lat, lon) {
  if (lat <= -60) return "Antarctica";
  if (lat >= -55 && lat <= 90 && lon >= -170 && lon <= -30) return "America";
  if (lat >= 35 && lat <= 72 && lon >= -10 && lon <= 40) return "Europe";
  if (lat >= 10 && lat <= 80 && lon >= 40 && lon <= 180) return "Asia";
  if (lat >= -35 && lat <= 37 && lon >= -20 && lon <= 55) return "Africa";
  if (lat >= -50 && lat <= 15 && lon >= 110 && lon <= 180) return "Oceania";
  return "Unknown";
}

// Application State
const state = {
  currentView: 'monitoring',
  currentSensorTab: 'lidar',
  selectedContinent: 'all',  // Continental filter
  detections: [],
  sensorData: {
    lidar: {
      altitudes: [500, 1000, 1500, 2000, 2500],
      vertical_velocities: [-2.1, -5.3, -8.5, -6.2, -3.1],
      backscatter: [0.3, 0.45, 0.6, 0.4, 0.2]
    },
    radar: {
      reflectivity: 65.2,
      radial_velocity: -12.5,
      spectrum_width: 3.2
    },
    anemometer: {
      wind_speed: 18.5,
      wind_direction: 240,
      temperature: 16.2,
      pressure: 1013.2
    }
  },
  reflectivityHistory: [],
  velocityHistory: [],
  timeLabels: [],
  settings: {
    windShearThreshold: 6,
    reflectivityThreshold: 60,
    confidenceThreshold: 85,
    showSensors: true,
    showWindVectors: true,
    soundAlerts: true,
    volume: 70
  },
  map: null,
  markers: [],
  charts: {}
};

// Constants
const AIRPORT = {
  id: 'bhx',
  name: 'Birmingham Airport',
  latitude: 52.453,
  longitude: -1.748,
  country: 'UK',
  iata: 'BHX'
};

const SEVERITY_COLORS = {
  LOW: '#228B22',
  MODERATE: '#FF8C00',
  SEVERE: '#DC143C',
  EXTREME: '#8B0000'
};

const CHART_COLORS = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];

// Filter detections by selected continent
function getFilteredDetections() {
  if (!state.selectedContinent || state.selectedContinent === 'all') {
    return state.detections;
  }
  return state.detections.filter(d => (d.continent || 'Unknown') === state.selectedContinent);
}




// Initialize Application
function initApp() {
  console.log('Initializing Microburst Detection Dashboard...');
  
  // Initialize historical data
  initializeHistoricalData();
  
  // Initialize UI
  initializeNavigation();
  initializeMap();
  initializeCharts();
  initializeSensorTabs();
  initializeSettings();
  initializeHistoryFilters();
  initializeContinentFilter();  // NEW: Continental filter
  
  // Start real-time updates
  startRealTimeUpdates();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  
  console.log('Dashboard initialized successfully');
}

// Initialize Continental Filter
function initializeContinentFilter() {
  const continentFilter = document.getElementById('continentFilter');
  if (continentFilter) {
    continentFilter.addEventListener('change', (e) => {
  state.selectedContinent = e.target.value;
  console.log(`Continental filter changed to: ${state.selectedContinent}`);
  flyToContinent(state.selectedContinent);                // ← NEW!
  updateMap();
  updateActiveAlerts();
});

  }
}

// Initialize Historical Data
function initializeHistoricalData() {
  const now = Date.now();
  
  // Generate 20 historical detections
  for (let i = 0; i < 20; i++) {
  const timestamp = now - (Math.random() * 24 * 60 * 60 * 1000);
  const severities = ['LOW', 'MODERATE', 'SEVERE', 'EXTREME'];
  const methods = ['LIDAR', 'DOPPLER_RADAR', 'ANEMOMETER', 'FUSION'];
  
  const airport = AIRPORTS_WORLDWIDE[Math.floor(Math.random() * AIRPORTS_WORLDWIDE.length)];
  const lat = airport.lat + (Math.random() - 0.5) * 0.5;
  const lon = airport.lon + (Math.random() - 0.5) * 0.5;
  const continent = airport.continent;

  state.detections.push({
    event_id: `evt_${new Date(timestamp).toISOString().split('T')[0].replace(/-/g, '')}_${String(i).padStart(3, '0')}`,
    timestamp: new Date(timestamp).toISOString(),
    latitude: lat,
    longitude: lon,
    altitude: 500 + Math.random() * 2000,
    continent: continent,
    severity: severities[Math.floor(Math.random() * severities.length)],
    confidence: 0.7 + Math.random() * 0.3,
    max_wind_shear: 3 + Math.random() * 12,
    vertical_velocity: -3 - Math.random() * 8,
    detection_method: methods[Math.floor(Math.random() * methods.length)],
    duration: 30 + Math.random() * 120
  });
}

  }
  
  // Sort by timestamp
  state.detections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Initialize time series data
  for (let i = 0; i < 20; i++) {
    state.timeLabels.push(`-${20-i}s`);
    state.reflectivityHistory.push(40 + Math.random() * 35);
    state.velocityHistory.push(-15 + Math.random() * 30);
  }
}

// Navigation
function initializeNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      switchView(viewName);
    });
  });
}

function switchView(viewName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}View`).classList.add('active');
  
  state.currentView = viewName;
  
  // Refresh view-specific content
  if (viewName === 'monitoring') {
    updateMap();
  } else if (viewName === 'history') {
    updateHistoryView();
  }
}

// Map Initialization
function initializeMap() {
  state.map = L.map('map').setView([AIRPORT.latitude, AIRPORT.longitude], 11);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(state.map);
  
  // Add airport marker
  const airportIcon = L.divIcon({
    className: 'airport-marker',
    html: `<div style="background: #0047AB; color: white; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      ✈️ ${AIRPORT.iata}
    </div>`,
    iconSize: [80, 32],
    iconAnchor: [40, 16]
  });
  
  L.marker([AIRPORT.latitude, AIRPORT.longitude], {icon: airportIcon})
    .addTo(state.map)
    .bindPopup(`<strong>${AIRPORT.name}</strong><br>${AIRPORT.country}`);
  
  // Initial map update
  updateMap();
}

// Update Map with filtered detections
function updateMap() {
  // Clear existing markers
  state.markers.forEach(marker => marker.remove());
  state.markers = [];
  
  // Get filtered active detections (last 15 minutes)
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const activeDetections = getFilteredDetections().filter(d =>
    new Date(d.timestamp).getTime() > fifteenMinutesAgo
  );
  
  // Add markers for active detections
  activeDetections.forEach(detection => {
    const color = SEVERITY_COLORS[detection.severity];
    const icon = L.divIcon({
      className: 'detection-marker',
      html: `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    const marker = L.marker([detection.latitude, detection.longitude], {icon})
      .addTo(state.map)
      .bindPopup(`
        <div style="min-width: 200px;">
          <strong style="color: ${color};">${detection.severity} MICROBURST</strong><br>
          <strong>ID:</strong> ${detection.event_id}<br>
          <strong>Time:</strong> ${new Date(detection.timestamp).toLocaleTimeString()}<br>
          <strong>Wind Shear:</strong> ${detection.max_wind_shear.toFixed(1)} m/s<br>
          <strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(0)}%<br>
          <strong>Continent:</strong> ${detection.continent || 'Unknown'}
        </div>
      `);
    
    state.markers.push(marker);
  });
  
  // Update active alerts panel
  updateActiveAlerts();
}

// Update Active Alerts Panel
function updateActiveAlerts() {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const activeDetections = getFilteredDetections().filter(d =>
    new Date(d.timestamp).getTime() > fifteenMinutesAgo
  );
  
  // Update count
  const alertCount = document.getElementById('alertCount');
  if (alertCount) {
    alertCount.textContent = activeDetections.length;
  }
  
  // Update alerts list
  const alertsList = document.getElementById('alertsList');
  if (alertsList) {
    alertsList.innerHTML = '';
    
    if (activeDetections.length === 0) {
      alertsList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #777;">
          <p>✅ No active alerts in ${state.selectedContinent === 'all' ? 'all regions' : state.selectedContinent}</p>
        </div>
      `;
    } else {
      activeDetections.slice(0, 5).forEach(detection => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        alertItem.style.borderLeft = `4px solid ${SEVERITY_COLORS[detection.severity]}`;
        alertItem.innerHTML = `
          <div class="alert-header">
            <span class="alert-severity" style="background: ${SEVERITY_COLORS[detection.severity]};">
              ${detection.severity}
            </span>
            <span class="alert-time">${getTimeAgo(detection.timestamp)}</span>
          </div>
          <div class="alert-details">
            <strong>${detection.event_id}</strong><br>
            Wind Shear: ${detection.max_wind_shear.toFixed(1)} m/s<br>
            Location: ${detection.continent || 'Unknown'}
          </div>
        `;
        alertsList.appendChild(alertItem);
      });
    }
  }
}

// Charts Initialization
function initializeCharts() {
  initializeReflectivityChart();
  initializeVelocityChart();
  initializeWindShearChart();
}

function initializeReflectivityChart() {
  const ctx = document.getElementById('reflectivityChart');
  if (!ctx) return;
  
  state.charts.reflectivity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.timeLabels,
      datasets: [{
        label: 'Reflectivity (dBZ)',
        data: state.reflectivityHistory,
        borderColor: CHART_COLORS[0],
        backgroundColor: CHART_COLORS[0] + '20',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, max: 80 }
      }
    }
  });
}

function initializeVelocityChart() {
  const ctx = document.getElementById('velocityChart');
  if (!ctx) return;
  
  state.charts.velocity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.timeLabels,
      datasets: [{
        label: 'Radial Velocity (m/s)',
        data: state.velocityHistory,
        borderColor: CHART_COLORS[1],
        backgroundColor: CHART_COLORS[1] + '20',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function initializeWindShearChart() {
  const ctx = document.getElementById('windShearChart');
  if (!ctx) return;
  
  const altitudes = state.sensorData.lidar.altitudes;
  const velocities = state.sensorData.lidar.vertical_velocities;
  
  state.charts.windShear = new Chart(ctx, {
    type: 'line',
    data: {
      labels: altitudes,
      datasets: [{
        label: 'Vertical Velocity',
        data: velocities,
        borderColor: CHART_COLORS[2],
        backgroundColor: CHART_COLORS[2] + '20',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { title: { display: true, text: 'Altitude (m)' } },
        y: { title: { display: true, text: 'Velocity (m/s)' } }
      }
    }
  });
}

// Sensor Tabs
function initializeSensorTabs() {
  const sensorTabs = document.querySelectorAll('.sensor-tab');
  sensorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const sensorType = tab.dataset.sensor;
      switchSensorTab(sensorType);
    });
  });
}

function switchSensorTab(sensorType) {
  // Update tabs
  document.querySelectorAll('.sensor-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.sensor === sensorType);
  });
  
  // Update panels
  document.querySelectorAll('.sensor-data-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`${sensorType}Data`).classList.add('active');
  
  state.currentSensorTab = sensorType;
  updateSensorDisplay(sensorType);
}

function updateSensorDisplay(sensorType) {
  const data = state.sensorData[sensorType];

  if (sensorType === 'lidar') {
    const altsEl = document.getElementById('lidarAltitudes');
    const velsEl = document.getElementById('lidarVelocities');
    const backEl = document.getElementById('lidarBackscatter');
    if (altsEl) altsEl.textContent = data.altitudes.join(', ') + ' m';
    if (velsEl) velsEl.textContent = data.vertical_velocities.map(v => v.toFixed(1)).join(', ') + ' m/s';
    if (backEl) backEl.textContent = data.backscatter.map(b => b.toFixed(2)).join(', ');
  } else if (sensorType === 'radar') {
    const reflEl = document.getElementById('radarReflectivity');
    const velEl = document.getElementById('radarVelocity');
    const specEl = document.getElementById('radarSpectrum');
    if (reflEl) reflEl.textContent = data.reflectivity.toFixed(1) + ' dBZ';
    if (velEl) velEl.textContent = data.radial_velocity.toFixed(1) + ' m/s';
    if (specEl) specEl.textContent = data.spectrum_width.toFixed(1) + ' m/s';
  } else if (sensorType === 'anemometer') {
    const windEl = document.getElementById('anemometerWind');
    const dirEl = document.getElementById('anemometerDirection');
    const tempEl = document.getElementById('anemometerTemp');
    const presEl = document.getElementById('anemometerPressure');
    if (windEl) windEl.textContent = data.wind_speed.toFixed(1) + ' m/s';
    if (dirEl) dirEl.textContent = data.wind_direction + '°';
    if (tempEl) tempEl.textContent = data.temperature.toFixed(1) + ' °C';
    if (presEl) presEl.textContent = data.pressure.toFixed(1) + ' hPa';
  }
}


// Settings
function initializeSettings() {
  // Load settings
  const thresholdInputs = {
    windShearThreshold: document.getElementById('windShearThreshold'),
    reflectivityThreshold: document.getElementById('reflectivityThreshold'),
    confidenceThreshold: document.getElementById('confidenceThreshold')
  };
  
  Object.keys(thresholdInputs).forEach(key => {
    const input = thresholdInputs[key];
    if (input) {
      input.value = state.settings[key];
      input.addEventListener('input', (e) => {
        state.settings[key] = parseFloat(e.target.value);
        document.getElementById(`${key}Value`).textContent = e.target.value;
      });
    }
  });
  
  // Toggles
  const toggles = ['showSensors', 'showWindVectors', 'soundAlerts'];
  toggles.forEach(toggle => {
    const checkbox = document.getElementById(toggle);
    if (checkbox) {
      checkbox.checked = state.settings[toggle];
      checkbox.addEventListener('change', (e) => {
        state.settings[toggle] = e.target.checked;
      });
    }
  });
  
  // Volume
  const volumeSlider = document.getElementById('volumeSlider');
  if (volumeSlider) {
    volumeSlider.value = state.settings.volume;
    volumeSlider.addEventListener('input', (e) => {
      state.settings.volume = parseInt(e.target.value);
      document.getElementById('volumeValue').textContent = e.target.value + '%';
    });
  }
}

// History View
function initializeHistoryFilters() {
  const severityFilter = document.getElementById('severityFilter');
  const methodFilter = document.getElementById('methodFilter');
  
  if (severityFilter) {
    severityFilter.addEventListener('change', updateHistoryView);
  }
  
  if (methodFilter) {
    methodFilter.addEventListener('change', updateHistoryView);
  }
}

function updateHistoryView() {
  const severityFilter = document.getElementById('severityFilter')?.value;
  const methodFilter = document.getElementById('methodFilter')?.value;
  
  let filtered = getFilteredDetections();
  
  if (severityFilter && severityFilter !== 'all') {
    filtered = filtered.filter(d => d.severity === severityFilter);
  }
  
  if (methodFilter && methodFilter !== 'all') {
    filtered = filtered.filter(d => d.detection_method === methodFilter);
  }
  
  displayHistoryTable(filtered);
  updateHistoryStats(filtered);
}

function displayHistoryTable(detections) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  detections.forEach(detection => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${detection.event_id}</td>
      <td>${new Date(detection.timestamp).toLocaleString()}</td>
      <td><span class="severity-badge" style="background: ${SEVERITY_COLORS[detection.severity]};">${detection.severity}</span></td>
      <td>${detection.max_wind_shear.toFixed(1)}</td>
      <td>${detection.vertical_velocity.toFixed(1)}</td>
      <td>${(detection.confidence * 100).toFixed(0)}%</td>
      <td>${detection.detection_method}</td>
      <td>${detection.continent || 'Unknown'}</td>
    `;
    tbody.appendChild(row);
  });
}

function updateHistoryStats(detections) {
  const stats = {
    total: detections.length,
    bySeverity: { LOW: 0, MODERATE: 0, SEVERE: 0, EXTREME: 0 }
  };
  
  detections.forEach(d => {
    stats.bySeverity[d.severity]++;
  });
  
  document.getElementById('totalDetections').textContent = stats.total;
  document.getElementById('lowSeverity').textContent = stats.bySeverity.LOW;
  document.getElementById('moderateSeverity').textContent = stats.bySeverity.MODERATE;
  document.getElementById('severeSeverity').textContent = stats.bySeverity.SEVERE;
  document.getElementById('extremeSeverity').textContent = stats.bySeverity.EXTREME;
}

// Real-time Updates
function startRealTimeUpdates() {
  // Update sensor data every 2 seconds
  setInterval(updateSensorData, 2000);
  
  // Generate new detection occasionally
  setInterval(generateNewDetection, 30000);
  
  // Update charts
  setInterval(updateCharts, 3000);
}

function updateSensorData() {
  // Simulate sensor data updates
  state.sensorData.lidar.vertical_velocities = 
    state.sensorData.lidar.vertical_velocities.map(v => v + (Math.random() - 0.5) * 0.5);
  
  state.sensorData.radar.reflectivity += (Math.random() - 0.5) * 2;
  state.sensorData.radar.radial_velocity += (Math.random() - 0.5) * 1;
  
  state.sensorData.anemometer.wind_speed += (Math.random() - 0.5) * 0.5;
  state.sensorData.anemometer.wind_direction = 
    (state.sensorData.anemometer.wind_direction + (Math.random() - 0.5) * 10 + 360) % 360;
  
  updateSensorDisplay(state.currentSensorTab);
}

function generateNewDetection() {
  // 20% chance to generate new detection
  if (Math.random() < 0.2) {
    const airport = AIRPORTS_WORLDWIDE[Math.floor(Math.random() * AIRPORTS_WORLDWIDE.length)];
const lat = airport.lat + (Math.random() - 0.5) * 0.5;
const lon = airport.lon + (Math.random() - 0.5) * 0.5;
const continent = airport.continent;

const newDetection = {
  event_id: `evt_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  timestamp: new Date().toISOString(),
  latitude: lat,
  longitude: lon,
  altitude: 500 + Math.random() * 2000,
  continent: continent,
  severity: severities[Math.floor(Math.random() * severities.length)],
  confidence: 0.7 + Math.random() * 0.3,
  max_wind_shear: 3 + Math.random() * 12,
  vertical_velocity: -3 - Math.random() * 8,
  detection_method: methods[Math.floor(Math.random() * methods.length)],
  duration: 30 + Math.random() * 120
};

    
    state.detections.unshift(newDetection);
    
    // Play alert sound if enabled
    if (state.settings.soundAlerts && newDetection.severity !== 'LOW') {
      playAlertSound();
    }
    
    // Update UI
    updateMap();
    updateHistoryView();
    
    console.log('New detection generated:', newDetection.event_id);
  }
}

function updateCharts() {
  // Update time series data
  state.reflectivityHistory.shift();
  state.reflectivityHistory.push(40 + Math.random() * 35);
  
  state.velocityHistory.shift();
  state.velocityHistory.push(-15 + Math.random() * 30);
  
  // Update charts
  if (state.charts.reflectivity) {
    state.charts.reflectivity.data.datasets[0].data = state.reflectivityHistory;
    state.charts.reflectivity.update('none');
  }
  
  if (state.charts.velocity) {
    state.charts.velocity.data.datasets[0].data = state.velocityHistory;
    state.charts.velocity.update('none');
  }
}

// Utilities
function updateSystemTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const timeEl = document.getElementById('systemTime');
  if (timeEl) {
    timeEl.innerHTML = `${timeStr}<br><small>${dateStr}</small>`;
  }
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function playAlertSound() {
  // Simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(state.settings.volume / 100, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}