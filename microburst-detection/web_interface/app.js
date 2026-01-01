

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

// API Configuration
const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  wsURL: 'ws://localhost:8000',
  endpoints: {
    health: '/health',
    detectLidar: '/detect/lidar',
    detectRadar: '/detect/radar',
    detectAnemometer: '/detect/anemometer',
    detections: '/detections',
    stats: '/stats',
    wsStream: '/ws/stream'
  }
};

// WebSocket connection
let wsConnection = null;

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
// Default airport (optional - can be configured or removed)
// Set to null to disable airport marker
const DEFAULT_AIRPORT = null; // or set to: { id: 'bhx', name: 'Birmingham Airport', latitude: 52.453, longitude: -1.748, country: 'UK', iata: 'BHX' }

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
  
  // Connect to API
  checkAPIHealth();
  connectWebSocket();
  loadDetections();
  loadStatistics();
  
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
      flyToContinent(state.selectedContinent);
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
  // Determine initial view: center on detections if available, otherwise global view
  let initialLat = 20, initialLon = 0, initialZoom = 2; // Global view by default
  
  // If there are detections, center on them
  if (state.detections.length > 0) {
    const lats = state.detections.map(d => d.latitude);
    const lons = state.detections.map(d => d.longitude);
    initialLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    initialLon = (Math.min(...lons) + Math.max(...lons)) / 2;
    initialZoom = state.detections.length === 1 ? 10 : 6; // Single detection: zoom in, multiple: regional view
  } else if (DEFAULT_AIRPORT) {
    // If no detections but airport is configured, center on airport
    initialLat = DEFAULT_AIRPORT.latitude;
    initialLon = DEFAULT_AIRPORT.longitude;
    initialZoom = 11; // Local view
  }
  
  state.map = L.map('map').setView([initialLat, initialLon], initialZoom);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(state.map);
  
  // Add airport marker only if configured
  if (DEFAULT_AIRPORT) {
    const airportIcon = L.divIcon({
      className: 'airport-marker',
      html: `<div style="background: #0047AB; color: white; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        ✈️ ${DEFAULT_AIRPORT.iata || DEFAULT_AIRPORT.id.toUpperCase()}
      </div>`,
      iconSize: [80, 32],
      iconAnchor: [40, 16]
    });
    
    L.marker([DEFAULT_AIRPORT.latitude, DEFAULT_AIRPORT.longitude], {icon: airportIcon})
      .addTo(state.map)
      .bindPopup(`<strong>${DEFAULT_AIRPORT.name}</strong><br>${DEFAULT_AIRPORT.country}`);
  }
  
  // Initial map update
  updateMap();
}

// Update Map with filtered detections
function updateMap() {
  // Clear existing detection markers (keep airport marker if exists)
  state.markers.forEach(marker => marker.remove());
  state.markers = [];
  
  // Get filtered detections
  const filtered = getFilteredDetections();
  
  // Get active detections (last 15 minutes)
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const activeDetections = filtered.filter(d =>
    new Date(d.timestamp).getTime() > fifteenMinutesAgo
  );
  
  // Determine which detections to show
  const detectionsToShow = activeDetections.length > 0 ? activeDetections : filtered;
  
  // If no detections at all, show appropriate view
  if (detectionsToShow.length === 0) {
    if (DEFAULT_AIRPORT) {
      state.map.setView([DEFAULT_AIRPORT.latitude, DEFAULT_AIRPORT.longitude], 11);
    } else {
      state.map.setView([20, 0], 2); // Global view
    }
    updateActiveAlerts();
    return;
  }
  
  // Add markers for detections
  detectionsToShow.forEach(detection => {
    const isActive = new Date(detection.timestamp).getTime() > fifteenMinutesAgo;
    const color = SEVERITY_COLORS[detection.severity] || '#888';
    const icon = L.divIcon({
      className: 'detection-marker',
      html: `<div style="background: ${color}; width: ${isActive ? '20' : '18'}px; height: ${isActive ? '20' : '18'}px; border-radius: 50%; border: ${isActive ? '3' : '2'}px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); ${isActive ? 'animation: pulse 2s infinite;' : 'opacity: 0.7;'}"></div>`,
      iconSize: [isActive ? 20 : 18, isActive ? 20 : 18],
      iconAnchor: [isActive ? 10 : 9, isActive ? 10 : 9]
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
          ${isActive ? '<br><small style="color: red;">⚠️ ACTIVE</small>' : ''}
        </div>
      `);
    
    state.markers.push(marker);
  });
  
  // Fit map to show detections with appropriate zoom
  if (detectionsToShow.length === 1) {
    // Single detection: zoom to local view
    state.map.setView([detectionsToShow[0].latitude, detectionsToShow[0].longitude], 10);
  } else if (detectionsToShow.length > 1) {
    // Multiple detections: fit bounds
    const bounds = detectionsToShow.map(d => [d.latitude, d.longitude]);
    state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: activeDetections.length > 0 ? 10 : 8 });
  }
  
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
  // Note: velocityChart removed - using reflectivityChart for combined display
  initializeWindShearChart();
  
  // Initialize sensor-specific charts
  initializeLidarCharts();
  initializeRadarCharts();
  initializeAnemometerCharts();
}

function initializeReflectivityChart() {
  const ctx = document.getElementById('reflectivityChart');
  if (!ctx) return;
  
  // Combined chart showing both reflectivity and velocity
  state.charts.reflectivity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.timeLabels,
      datasets: [
        {
          label: 'Reflectivity (dBZ)',
          data: state.reflectivityHistory,
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + '20',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Radial Velocity (m/s)',
          data: state.velocityHistory,
          borderColor: CHART_COLORS[1],
          backgroundColor: CHART_COLORS[1] + '20',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          max: 80,
          title: { display: true, text: 'Reflectivity (dBZ)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: false,
          title: { display: true, text: 'Velocity (m/s)' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// Initialize LIDAR charts
function initializeLidarCharts() {
  const velocityCtx = document.getElementById('lidarVelocityChart');
  if (velocityCtx) {
    state.charts.lidarVelocity = new Chart(velocityCtx, {
      type: 'line',
      data: {
        labels: state.sensorData.lidar.altitudes,
        datasets: [{
          label: 'Vertical Velocity',
          data: state.sensorData.lidar.vertical_velocities,
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + '20',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Altitude (m)' } },
          y: { title: { display: true, text: 'Velocity (m/s)' } }
        }
      }
    });
  }
  
  const backscatterCtx = document.getElementById('lidarBackscatterChart');
  if (backscatterCtx) {
    state.charts.lidarBackscatter = new Chart(backscatterCtx, {
      type: 'line',
      data: {
        labels: state.sensorData.lidar.altitudes,
        datasets: [{
          label: 'Backscatter',
          data: state.sensorData.lidar.backscatter,
          borderColor: CHART_COLORS[1],
          backgroundColor: CHART_COLORS[1] + '20',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Altitude (m)' } },
          y: { title: { display: true, text: 'Backscatter' }, min: 0, max: 1 }
        }
      }
    });
  }
}

// Initialize Radar charts
function initializeRadarCharts() {
  const reflectivityCtx = document.getElementById('radarReflectivityChart');
  if (reflectivityCtx) {
    state.charts.radarReflectivity = new Chart(reflectivityCtx, {
      type: 'bar',
      data: {
        labels: ['Current'],
        datasets: [{
          label: 'Reflectivity',
          data: [state.sensorData.radar.reflectivity],
          backgroundColor: CHART_COLORS[2]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 80 } }
      }
    });
  }
  
  const spectrumCtx = document.getElementById('radarSpectrumChart');
  if (spectrumCtx) {
    state.charts.radarSpectrum = new Chart(spectrumCtx, {
      type: 'line',
      data: {
        labels: state.timeLabels.slice(-10),
        datasets: [{
          label: 'Spectrum Width',
          data: Array(10).fill(state.sensorData.radar.spectrum_width),
          borderColor: CHART_COLORS[3],
          backgroundColor: CHART_COLORS[3] + '20',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}

// Initialize Anemometer charts
function initializeAnemometerCharts() {
  const windCtx = document.getElementById('anemometerWindChart');
  if (windCtx) {
    state.charts.anemometerWind = new Chart(windCtx, {
      type: 'line',
      data: {
        labels: state.timeLabels.slice(-10),
        datasets: [{
          label: 'Wind Speed',
          data: Array(10).fill(state.sensorData.anemometer.wind_speed),
          borderColor: CHART_COLORS[4],
          backgroundColor: CHART_COLORS[4] + '20',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
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
  const sensorTabButtons = document.querySelectorAll('.sensor-tabs .tab-btn');
  sensorTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sensorType = btn.dataset.sensor;
      switchSensorTab(sensorType);
    });
  });
}

function switchSensorTab(sensorType) {
  // Update tab buttons
  document.querySelectorAll('.sensor-tabs .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sensor === sensorType);
  });
  
  // Update tab content panels
  document.querySelectorAll('.sensor-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const targetTab = document.getElementById(`${sensorType}Tab`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  state.currentSensorTab = sensorType;
  updateSensorDisplay(sensorType);
}

function updateSensorDisplay(sensorType) {
  const data = state.sensorData[sensorType];

  if (sensorType === 'lidar') {
    // Update stats
    const minVelEl = document.getElementById('lidarMinVel');
    const maxVelEl = document.getElementById('lidarMaxVel');
    const qualityEl = document.getElementById('lidarQuality');
    const lastUpdateEl = document.getElementById('lidarLastUpdate');
    
    if (minVelEl) minVelEl.textContent = Math.min(...data.vertical_velocities).toFixed(1) + ' m/s';
    if (maxVelEl) maxVelEl.textContent = Math.max(...data.vertical_velocities).toFixed(1) + ' m/s';
    if (qualityEl) qualityEl.textContent = Math.round(data.backscatter.reduce((a, b) => a + b, 0) / data.backscatter.length * 100) + '%';
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString();
    
    // Update charts if they exist
    if (state.charts.lidarVelocity) {
      state.charts.lidarVelocity.data.datasets[0].data = data.vertical_velocities;
      state.charts.lidarVelocity.update('none');
    }
    if (state.charts.lidarBackscatter) {
      state.charts.lidarBackscatter.data.datasets[0].data = data.backscatter;
      state.charts.lidarBackscatter.update('none');
    }
  } else if (sensorType === 'radar') {
    const reflEl = document.getElementById('radarReflectivity');
    const velEl = document.getElementById('radarVelocity');
    const qualityEl = document.getElementById('radarQuality');
    const lastUpdateEl = document.getElementById('radarLastUpdate');
    
    if (reflEl) reflEl.textContent = data.reflectivity.toFixed(1) + ' dBZ';
    if (velEl) velEl.textContent = data.radial_velocity.toFixed(1) + ' m/s';
    if (qualityEl) qualityEl.textContent = '85%'; // Placeholder
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString();
    
    // Update charts if they exist
    if (state.charts.radarReflectivity) {
      // Update reflectivity chart
    }
    if (state.charts.radarSpectrum) {
      // Update spectrum chart
    }
  } else if (sensorType === 'anemometer') {
    const speedEl = document.getElementById('anemometerSpeed');
    const dirEl = document.getElementById('anemometerDirection');
    const qualityEl = document.getElementById('anemometerQuality');
    const lastUpdateEl = document.getElementById('anemometerLastUpdate');
    
    if (speedEl) speedEl.textContent = data.wind_speed.toFixed(1) + ' m/s';
    if (dirEl) dirEl.textContent = data.wind_direction.toFixed(0) + '°';
    if (qualityEl) qualityEl.textContent = '90%'; // Placeholder
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString();
    
    // Update wind compass
    const compassArrow = document.getElementById('compassArrow');
    if (compassArrow) {
      compassArrow.style.transform = `rotate(${data.wind_direction}deg)`;
    }
    
    // Update wind chart if it exists
    if (state.charts.anemometerWind) {
      // Update wind chart
    }
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
  
  // API Endpoint and Connection Test
  const apiEndpointInput = document.getElementById('apiEndpoint');
  if (apiEndpointInput) {
    apiEndpointInput.value = API_CONFIG.baseURL;
    apiEndpointInput.addEventListener('change', (e) => {
      API_CONFIG.baseURL = e.target.value;
      checkAPIHealth();
    });
  }
  
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', testAPIConnection);
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
  const tbody = document.getElementById('detectionTableBody');
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
    const severities = ['LOW', 'MODERATE', 'SEVERE', 'EXTREME'];
    const methods = ['LIDAR', 'DOPPLER_RADAR', 'ANEMOMETER', 'FUSION'];
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
  
  // Update reflectivity chart (combined with velocity)
  if (state.charts.reflectivity) {
    if (state.charts.reflectivity.data.datasets[0]) {
      state.charts.reflectivity.data.datasets[0].data = state.reflectivityHistory;
    }
    if (state.charts.reflectivity.data.datasets[1]) {
      state.charts.reflectivity.data.datasets[1].data = state.velocityHistory;
    }
    state.charts.reflectivity.update('none');
  }
  
  // Update wind shear chart
  if (state.charts.windShear) {
    state.charts.windShear.data.datasets[0].data = state.sensorData.lidar.vertical_velocities;
    state.charts.windShear.update('none');
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

// API Connection Functions
async function checkAPIHealth() {
  try {
    const apiEndpoint = document.getElementById('apiEndpoint')?.value || API_CONFIG.baseURL;
    const response = await fetch(`${apiEndpoint}${API_CONFIG.endpoints.health}`);
    
    if (response.ok) {
      const data = await response.json();
      state.apiConnected = true;
      updateConnectionStatus(true);
      console.log('API Health:', data);
      return true;
    } else {
      state.apiConnected = false;
      updateConnectionStatus(false);
      return false;
    }
  } catch (error) {
    console.error('API Health check failed:', error);
    state.apiConnected = false;
    updateConnectionStatus(false);
    return false;
  }
}

function updateConnectionStatus(connected) {
  const statusEl = document.querySelector('.connection-status .status-indicator');
  const statusText = document.querySelector('.connection-status span:last-child');
  
  if (statusEl && statusText) {
    statusEl.classList.toggle('connected', connected);
    statusEl.classList.toggle('disconnected', !connected);
    statusText.textContent = connected ? 'Conectado' : 'Desconectado';
  }
  
  // Update system status
  const systemStatus = document.getElementById('systemStatus');
  if (systemStatus) {
    const statusText = systemStatus.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = connected ? 'OPERACIONAL' : 'DESCONECTADO';
    }
  }
}

function connectWebSocket() {
  try {
    const apiEndpoint = document.getElementById('apiEndpoint')?.value || API_CONFIG.baseURL;
    const wsURL = apiEndpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsPath = `${wsURL}${API_CONFIG.endpoints.wsStream}`;
    
    if (wsConnection) {
      wsConnection.close();
    }
    
    wsConnection = new WebSocket(wsPath);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected');
      state.apiConnected = true;
      updateConnectionStatus(true);
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'detection' && message.data) {
          handleNewDetection(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      state.apiConnected = false;
      updateConnectionStatus(false);
    };
    
    wsConnection.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5s...');
      state.apiConnected = false;
      updateConnectionStatus(false);
      setTimeout(connectWebSocket, 5000);
    };
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    // Fallback to simulated data
  }
}

function handleNewDetection(detectionData) {
  // Map API response to internal format
  const continent = getContinentByCoords(detectionData.latitude, detectionData.longitude);
  
  const newDetection = {
    event_id: detectionData.event_id,
    timestamp: detectionData.timestamp,
    latitude: detectionData.latitude,
    longitude: detectionData.longitude,
    altitude: detectionData.altitude,
    continent: continent,
    severity: detectionData.severity?.toUpperCase() || 'LOW',
    confidence: detectionData.confidence || 0.5,
    max_wind_shear: detectionData.max_wind_shear || 0,
    vertical_velocity: detectionData.vertical_velocity || 0,
    detection_method: detectionData.detection_method?.toUpperCase() || 'UNKNOWN',
    duration: detectionData.duration_seconds || 180
  };
  
  state.detections.unshift(newDetection);
  
  // Play alert sound if enabled
  if (state.settings.soundAlerts && newDetection.severity !== 'LOW') {
    playAlertSound();
  }
  
  // Update UI
  updateMap();
  updateActiveAlerts();
  if (state.currentView === 'history') {
    updateHistoryView();
  }
  
  console.log('New detection received:', newDetection.event_id);
}

async function loadDetections() {
  try {
    const apiEndpoint = document.getElementById('apiEndpoint')?.value || API_CONFIG.baseURL;
    const response = await fetch(`${apiEndpoint}${API_CONFIG.endpoints.detections}?hours=24`);
    
    if (response.ok) {
      const detections = await response.json();
      // Convert API detections to internal format
      detections.forEach(det => {
        const continent = getContinentByCoords(det.latitude, det.longitude);
        state.detections.push({
          event_id: det.event_id,
          timestamp: det.timestamp,
          latitude: det.latitude,
          longitude: det.longitude,
          altitude: det.altitude,
          continent: continent,
          severity: det.severity?.toUpperCase() || 'LOW',
          confidence: det.confidence || 0.5,
          max_wind_shear: det.max_wind_shear || 0,
          vertical_velocity: det.vertical_velocity || 0,
          detection_method: det.detection_method?.toUpperCase() || 'UNKNOWN',
          duration: det.duration_seconds || 180
        });
      });
      
      // Sort by timestamp
      state.detections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      updateMap();
      if (state.currentView === 'history') {
        updateHistoryView();
      }
    }
  } catch (error) {
    console.error('Error loading detections:', error);
    // Continue with simulated data
  }
}

async function loadStatistics() {
  try {
    const apiEndpoint = document.getElementById('apiEndpoint')?.value || API_CONFIG.baseURL;
    const response = await fetch(`${apiEndpoint}${API_CONFIG.endpoints.stats}?days=7`);
    
    if (response.ok) {
      const stats = await response.json();
      console.log('Statistics loaded:', stats);
      // Update statistics display if needed
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Test API connection
function testAPIConnection() {
  const apiEndpoint = document.getElementById('apiEndpoint')?.value || API_CONFIG.baseURL;
  API_CONFIG.baseURL = apiEndpoint;
  checkAPIHealth().then(connected => {
    if (connected) {
      showToast('Conexión exitosa', 'success');
      connectWebSocket();
      loadDetections();
    } else {
      showToast('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
    }
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  const container = document.getElementById('toastContainer');
  if (container) {
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}