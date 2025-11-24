// Application State
const state = {
  currentView: 'monitoring',
  currentSensorTab: 'lidar',
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
  
  // Start real-time updates
  startRealTimeUpdates();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  
  console.log('Dashboard initialized successfully');
}

// Initialize Historical Data
function initializeHistoricalData() {
  const now = Date.now();
  
  // Generate 20 historical detections
  for (let i = 0; i < 20; i++) {
    const timestamp = now - (Math.random() * 24 * 60 * 60 * 1000);
    const severities = ['LOW', 'MODERATE', 'SEVERE', 'EXTREME'];
    const methods = ['LIDAR', 'DOPPLER_RADAR', 'ANEMOMETER', 'FUSION'];
    
    state.detections.push({
      event_id: `evt_${new Date(timestamp).toISOString().split('T')[0].replace(/-/g, '')}_${String(i).padStart(3, '0')}`,
      timestamp: new Date(timestamp).toISOString(),
      latitude: AIRPORT.latitude + (Math.random() - 0.5) * 0.05,
      longitude: AIRPORT.longitude + (Math.random() - 0.5) * 0.05,
      altitude: 500 + Math.random() * 2000,
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
  state.map = L.map('map').setView([AIRPORT.latitude, AIRPORT.longitude], 11);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(state.map);
  
  // Add airport marker
  const airportIcon = L.divIcon({
    className: 'airport-marker',
    html: `<div style="background: #0047AB; color: white; padding: 8px 12px; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${AIRPORT.iata}</div>`,
    iconSize: [60, 30]
  });
  
  L.marker([AIRPORT.latitude, AIRPORT.longitude], { icon: airportIcon })
    .bindPopup(`<strong>${AIRPORT.name}</strong><br>IATA: ${AIRPORT.iata}`)
    .addTo(state.map);
  
  // Add sensor locations
  addSensorMarkers();
  
  setTimeout(() => {
    state.map.invalidateSize();
  }, 100);
}

function addSensorMarkers() {
  const sensors = [
    { name: 'LIDAR', lat: AIRPORT.latitude + 0.01, lng: AIRPORT.longitude - 0.02, color: '#1FB8CD' },
    { name: 'Radar', lat: AIRPORT.latitude - 0.01, lng: AIRPORT.longitude + 0.015, color: '#FFC185' },
    { name: 'Anemometer', lat: AIRPORT.latitude + 0.015, lng: AIRPORT.longitude + 0.01, color: '#5D878F' }
  ];
  
  sensors.forEach(sensor => {
    const sensorIcon = L.divIcon({
      className: 'sensor-marker',
      html: `<div style="width: 12px; height: 12px; background: ${sensor.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px ${sensor.color};"></div>`,
      iconSize: [12, 12]
    });
    
    L.marker([sensor.lat, sensor.lng], { icon: sensorIcon })
      .bindPopup(`<strong>${sensor.name}</strong><br>Estado: Operacional`)
      .addTo(state.map);
  });
}

function updateMap() {
  // Remove old detection markers
  state.markers.forEach(marker => marker.remove());
  state.markers = [];
  
  // Add active detections (last 15 minutes)
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const activeDetections = state.detections.filter(d => 
    new Date(d.timestamp).getTime() > fifteenMinutesAgo
  );
  
  activeDetections.forEach(detection => {
    const color = SEVERITY_COLORS[detection.severity];
    
    // Create pulsing circle
    const circle = L.circle([detection.latitude, detection.longitude], {
      color: color,
      fillColor: color,
      fillOpacity: 0.3,
      radius: 1000,
      className: detection.severity === 'EXTREME' || detection.severity === 'SEVERE' ? 'pulse-animation' : ''
    }).addTo(state.map);
    
    circle.on('click', () => showDetectionModal(detection));
    
    circle.bindPopup(`
      <strong>Detección ${detection.severity}</strong><br>
      Confianza: ${(detection.confidence * 100).toFixed(0)}%<br>
      Cizalladura: ${detection.max_wind_shear.toFixed(1)} m/s<br>
      <button onclick="showDetectionModal(${JSON.stringify(detection).replace(/"/g, '&quot;')})">Ver Detalles</button>
    `);
    
    state.markers.push(circle);
  });
  
  // Update alert count
  document.getElementById('alertCount').textContent = activeDetections.length;
  
  // Update critical alert display
  updateCriticalAlert(activeDetections);
}

function updateCriticalAlert(detections) {
  const criticalAlertDiv = document.getElementById('criticalAlert');
  
  const criticalDetections = detections.filter(d => 
    d.severity === 'EXTREME' || d.severity === 'SEVERE'
  );
  
  if (criticalDetections.length > 0) {
    const detection = criticalDetections[0];
    const timeAgo = Math.floor((Date.now() - new Date(detection.timestamp).getTime()) / 1000);
    
    criticalAlertDiv.innerHTML = `
      <div class="alert-severity" style="color: ${SEVERITY_COLORS[detection.severity]}">
        🚨 ALERTA ${detection.severity}
      </div>
      <div class="alert-details">
        <div>Cizalladura: ${detection.max_wind_shear.toFixed(1)} m/s</div>
        <div>Confianza: ${(detection.confidence * 100).toFixed(0)}%</div>
        <div>Hace ${timeAgo}s</div>
      </div>
    `;
  } else {
    criticalAlertDiv.innerHTML = '<div style="text-align: center; color: #228B22; padding: 1rem;">✓ Sin alertas críticas</div>';
  }
}

// Charts Initialization
function initializeCharts() {
  // Reflectivity & Velocity Chart
  const reflectivityCtx = document.getElementById('reflectivityChart').getContext('2d');
  state.charts.reflectivity = new Chart(reflectivityCtx, {
    type: 'line',
    data: {
      labels: state.timeLabels,
      datasets: [
        {
          label: 'Reflectividad (dBZ)',
          data: state.reflectivityHistory,
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + '33',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Velocidad Radial (m/s)',
          data: state.velocityHistory,
          borderColor: CHART_COLORS[1],
          backgroundColor: CHART_COLORS[1] + '33',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#F1F5F9' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        y: {
          type: 'linear',
          position: 'left',
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          title: { display: true, text: 'Reflectividad (dBZ)', color: '#94A3B8' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          ticks: { color: '#94A3B8' },
          grid: { display: false },
          title: { display: true, text: 'Velocidad (m/s)', color: '#94A3B8' }
        }
      }
    }
  });
  
  // Wind Shear Chart
  const windShearCtx = document.getElementById('windShearChart').getContext('2d');
  const altitudes = ['500m', '1000m', '1500m', '2000m', '2500m'];
  const shearData = [2.5, 5.8, 8.5, 6.2, 3.1];
  const shearColors = shearData.map(v => v < 3 ? '#228B22' : v < 6 ? '#FF8C00' : '#DC143C');
  
  state.charts.windShear = new Chart(windShearCtx, {
    type: 'bar',
    data: {
      labels: altitudes,
      datasets: [{
        label: 'Cizalladura (m/s)',
        data: shearData,
        backgroundColor: shearColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#F1F5F9' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        y: {
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          title: { display: true, text: 'Cizalladura (m/s)', color: '#94A3B8' }
        }
      }
    }
  });
  
  // LIDAR Velocity Chart
  const lidarVelCtx = document.getElementById('lidarVelocityChart').getContext('2d');
  state.charts.lidarVelocity = new Chart(lidarVelCtx, {
    type: 'line',
    data: {
      labels: state.sensorData.lidar.altitudes.map(a => `${a}m`),
      datasets: [{
        label: 'Velocidad Vertical (m/s)',
        data: state.sensorData.lidar.vertical_velocities,
        borderColor: CHART_COLORS[0],
        backgroundColor: CHART_COLORS[0] + '33',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#F1F5F9' } } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      }
    }
  });
  
  // LIDAR Backscatter Chart
  const lidarBackCtx = document.getElementById('lidarBackscatterChart').getContext('2d');
  state.charts.lidarBackscatter = new Chart(lidarBackCtx, {
    type: 'bar',
    data: {
      labels: state.sensorData.lidar.altitudes.map(a => `${a}m`),
      datasets: [{
        label: 'Retrodispersión',
        data: state.sensorData.lidar.backscatter,
        backgroundColor: CHART_COLORS[1]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#F1F5F9' } } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      }
    }
  });
  
  // Radar Reflectivity Chart
  const radarRefCtx = document.getElementById('radarReflectivityChart').getContext('2d');
  state.charts.radarReflectivity = new Chart(radarRefCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill(0).map((_, i) => `-${20-i}s`),
      datasets: [{
        label: 'Reflectividad (dBZ)',
        data: Array(20).fill(0).map(() => 50 + Math.random() * 25),
        borderColor: CHART_COLORS[2],
        backgroundColor: CHART_COLORS[2] + '33',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#F1F5F9' } } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      }
    }
  });
  
  // Radar Spectrum Chart
  const radarSpecCtx = document.getElementById('radarSpectrumChart').getContext('2d');
  state.charts.radarSpectrum = new Chart(radarSpecCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill(0).map((_, i) => `-${20-i}s`),
      datasets: [{
        label: 'Ancho Espectral',
        data: Array(20).fill(0).map(() => 2 + Math.random() * 3),
        borderColor: CHART_COLORS[3],
        backgroundColor: CHART_COLORS[3] + '33',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#F1F5F9' } } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      }
    }
  });
  
  // Anemometer Wind Chart
  const anemometerCtx = document.getElementById('anemometerWindChart').getContext('2d');
  state.charts.anemometerWind = new Chart(anemometerCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill(0).map((_, i) => `-${20-i}s`),
      datasets: [{
        label: 'Velocidad del Viento (m/s)',
        data: Array(20).fill(0).map(() => 10 + Math.random() * 15),
        borderColor: CHART_COLORS[4],
        backgroundColor: CHART_COLORS[4] + '33',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#F1F5F9' } } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
      }
    }
  });
}

// Sensor Tabs
function initializeSensorTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sensorType = btn.dataset.sensor;
      
      // Update tab buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update tab content
      document.querySelectorAll('.sensor-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      document.getElementById(`${sensorType}Tab`).classList.add('active');
      
      state.currentSensorTab = sensorType;
    });
  });
  
  // Update sensor stats
  updateSensorStats();
}

function updateSensorStats() {
  // LIDAR stats
  const lidarVels = state.sensorData.lidar.vertical_velocities;
  document.getElementById('lidarMinVel').textContent = `${Math.min(...lidarVels).toFixed(1)} m/s`;
  document.getElementById('lidarMaxVel').textContent = `${Math.max(...lidarVels).toFixed(1)} m/s`;
  document.getElementById('lidarQuality').textContent = `${(92 + Math.random() * 7).toFixed(0)}%`;
  document.getElementById('lidarLastUpdate').textContent = new Date().toLocaleTimeString();
  
  // Radar stats
  document.getElementById('radarReflectivity').textContent = `${state.sensorData.radar.reflectivity.toFixed(1)} dBZ`;
  document.getElementById('radarVelocity').textContent = `${state.sensorData.radar.radial_velocity.toFixed(1)} m/s`;
  document.getElementById('radarQuality').textContent = `${(88 + Math.random() * 10).toFixed(0)}%`;
  document.getElementById('radarLastUpdate').textContent = new Date().toLocaleTimeString();
  
  // Anemometer stats
  document.getElementById('anemometerSpeed').textContent = `${state.sensorData.anemometer.wind_speed.toFixed(1)} m/s`;
  document.getElementById('anemometerDirection').textContent = `${state.sensorData.anemometer.wind_direction}°`;
  document.getElementById('anemometerQuality').textContent = `${(95 + Math.random() * 5).toFixed(0)}%`;
  document.getElementById('anemometerLastUpdate').textContent = new Date().toLocaleTimeString();
  
  // Update wind compass
  const arrow = document.getElementById('compassArrow');
  if (arrow) {
    arrow.style.transform = `translate(-50%, -100%) rotate(${state.sensorData.anemometer.wind_direction}deg)`;
  }
  
  // Fusion data
  document.getElementById('fusionConfidence').querySelector('.confidence-value').textContent = 
    `${(85 + Math.random() * 12).toFixed(0)}%`;
  
  document.getElementById('kalmanX').textContent = (Math.random() * 100).toFixed(2);
  document.getElementById('kalmanY').textContent = (Math.random() * 100).toFixed(2);
  document.getElementById('kalmanV').textContent = (5 + Math.random() * 10).toFixed(2);
  document.getElementById('kalmanA').textContent = (Math.random() * 2).toFixed(2);
}

// Settings
function initializeSettings() {
  // Sliders
  const windShearSlider = document.getElementById('windShearThreshold');
  const reflectivitySlider = document.getElementById('reflectivityThreshold');
  const confidenceSlider = document.getElementById('confidenceThreshold');
  const volumeSlider = document.getElementById('volumeSlider');
  
  windShearSlider.addEventListener('input', (e) => {
    document.getElementById('windShearThresholdValue').textContent = e.target.value;
    state.settings.windShearThreshold = parseFloat(e.target.value);
  });
  
  reflectivitySlider.addEventListener('input', (e) => {
    document.getElementById('reflectivityThresholdValue').textContent = e.target.value;
    state.settings.reflectivityThreshold = parseFloat(e.target.value);
  });
  
  confidenceSlider.addEventListener('input', (e) => {
    document.getElementById('confidenceThresholdValue').textContent = e.target.value;
    state.settings.confidenceThreshold = parseFloat(e.target.value);
  });
  
  volumeSlider.addEventListener('input', (e) => {
    document.getElementById('volumeValue').textContent = e.target.value;
    state.settings.volume = parseFloat(e.target.value);
  });
  
  // Toggles
  document.getElementById('showSensors').addEventListener('change', (e) => {
    state.settings.showSensors = e.target.checked;
  });
  
  document.getElementById('showWindVectors').addEventListener('change', (e) => {
    state.settings.showWindVectors = e.target.checked;
  });
  
  document.getElementById('soundAlerts').addEventListener('change', (e) => {
    state.settings.soundAlerts = e.target.checked;
  });
  
  // Buttons
  document.getElementById('testConnectionBtn').addEventListener('click', () => {
    showToast('Conexión exitosa al servidor de API', 'success');
  });
  
  document.getElementById('exportCSV').addEventListener('click', () => {
    exportToCSV();
  });
  
  document.getElementById('exportJSON').addEventListener('click', () => {
    exportToJSON();
  });
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  document.getElementById('exportStartDate').value = weekAgo;
  document.getElementById('exportEndDate').value = today;
}

// History View
function initializeHistoryFilters() {
  document.getElementById('severityFilter').addEventListener('change', () => {
    updateHistoryView();
  });
}

function updateHistoryView() {
  const filter = document.getElementById('severityFilter').value;
  
  let filteredDetections = state.detections;
  if (filter !== 'all') {
    filteredDetections = state.detections.filter(d => d.severity === filter);
  }
  
  // Update timeline chart
  updateTimelineChart(filteredDetections);
  
  // Update severity distribution chart
  updateSeverityChart(filteredDetections);
  
  // Update table
  updateDetectionTable(filteredDetections);
}

function updateTimelineChart(detections) {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recentDetections = detections.filter(d => new Date(d.timestamp).getTime() > last24h);
  
  // Group by hour
  const hourlyData = new Array(24).fill(0);
  recentDetections.forEach(d => {
    const hour = 23 - Math.floor((Date.now() - new Date(d.timestamp).getTime()) / (60 * 60 * 1000));
    if (hour >= 0 && hour < 24) hourlyData[hour]++;
  });
  
  const labels = Array(24).fill(0).map((_, i) => `-${24-i}h`);
  
  if (!state.charts.timeline) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    state.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Detecciones por Hora',
          data: hourlyData,
          borderColor: CHART_COLORS[0],
          backgroundColor: CHART_COLORS[0] + '33',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#F1F5F9' } } },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' }, beginAtZero: true }
        }
      }
    });
  } else {
    state.charts.timeline.data.labels = labels;
    state.charts.timeline.data.datasets[0].data = hourlyData;
    state.charts.timeline.update();
  }
}

function updateSeverityChart(detections) {
  const severityCounts = {
    LOW: 0,
    MODERATE: 0,
    SEVERE: 0,
    EXTREME: 0
  };
  
  detections.forEach(d => {
    severityCounts[d.severity]++;
  });
  
  if (!state.charts.severity) {
    const ctx = document.getElementById('severityChart').getContext('2d');
    state.charts.severity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baja', 'Moderada', 'Severa', 'Extrema'],
        datasets: [{
          label: 'Número de Detecciones',
          data: [severityCounts.LOW, severityCounts.MODERATE, severityCounts.SEVERE, severityCounts.EXTREME],
          backgroundColor: [
            SEVERITY_COLORS.LOW,
            SEVERITY_COLORS.MODERATE,
            SEVERITY_COLORS.SEVERE,
            SEVERITY_COLORS.EXTREME
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#F1F5F9' } } },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' }, beginAtZero: true }
        }
      }
    });
  } else {
    state.charts.severity.data.datasets[0].data = [
      severityCounts.LOW,
      severityCounts.MODERATE,
      severityCounts.SEVERE,
      severityCounts.EXTREME
    ];
    state.charts.severity.update();
  }
}

function updateDetectionTable(detections) {
  const tbody = document.getElementById('detectionTableBody');
  tbody.innerHTML = '';
  
  detections.slice(0, 15).forEach(detection => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${detection.event_id}</td>
      <td>${new Date(detection.timestamp).toLocaleString()}</td>
      <td><span class="severity-badge severity-${detection.severity}">${detection.severity}</span></td>
      <td>${(detection.confidence * 100).toFixed(0)}%</td>
      <td>${detection.duration.toFixed(0)}s</td>
      <td>${detection.max_wind_shear.toFixed(1)} m/s</td>
      <td><button class="view-details-btn" onclick="showDetectionModal(${JSON.stringify(detection).replace(/"/g, '&quot;')})">Ver Detalles</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Modal
function showDetectionModal(detection) {
  if (typeof detection === 'string') {
    detection = JSON.parse(detection.replace(/&quot;/g, '"'));
  }
  
  const modal = document.getElementById('detectionModal');
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">ID de Evento:</span>
      <span class="detail-value">${detection.event_id}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Timestamp:</span>
      <span class="detail-value">${new Date(detection.timestamp).toLocaleString()}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Severidad:</span>
      <span class="severity-badge severity-${detection.severity}">${detection.severity}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Confianza:</span>
      <span class="detail-value">${(detection.confidence * 100).toFixed(1)}%</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Ubicación:</span>
      <span class="detail-value">${detection.latitude.toFixed(4)}°N, ${detection.longitude.toFixed(4)}°W</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Altitud:</span>
      <span class="detail-value">${detection.altitude.toFixed(0)}m</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Cizalladura Máxima:</span>
      <span class="detail-value">${detection.max_wind_shear.toFixed(1)} m/s</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Velocidad Vertical:</span>
      <span class="detail-value">${detection.vertical_velocity.toFixed(1)} m/s</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Método de Detección:</span>
      <span class="detail-value">${detection.detection_method}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Duración:</span>
      <span class="detail-value">${detection.duration.toFixed(0)}s</span>
    </div>
  `;
  
  modal.classList.add('active');
}

// Make showDetectionModal available globally
window.showDetectionModal = showDetectionModal;

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('detectionModal').classList.remove('active');
});

document.getElementById('detectionModal').addEventListener('click', (e) => {
  if (e.target.id === 'detectionModal') {
    document.getElementById('detectionModal').classList.remove('active');
  }
});

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const color = type === 'success' ? '#228B22' : type === 'error' ? '#DC143C' : '#0047AB';
  toast.style.borderColor = color;
  
  toast.innerHTML = `
    <div class="toast-header" style="color: ${color}">${type.toUpperCase()}</div>
    <div class="toast-body">${message}</div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Real-time Updates
function startRealTimeUpdates() {
  // Update sensor data every 2 seconds
  setInterval(() => {
    updateSensorData();
    updateWeatherMetrics();
    updateCharts();
    updateSensorStats();
  }, 2000);
  
  // Generate new detections every 15-30 seconds
  setInterval(() => {
    if (Math.random() > 0.5) {
      generateNewDetection();
    }
  }, 20000);
  
  // Update map every 5 seconds
  setInterval(() => {
    if (state.currentView === 'monitoring') {
      updateMap();
    }
  }, 5000);
}

function updateSensorData() {
  // Update LIDAR
  state.sensorData.lidar.vertical_velocities = state.sensorData.lidar.vertical_velocities.map(
    v => v + (Math.random() - 0.5) * 0.5
  );
  state.sensorData.lidar.backscatter = state.sensorData.lidar.backscatter.map(
    b => Math.max(0, Math.min(1, b + (Math.random() - 0.5) * 0.1))
  );
  
  // Update Radar
  state.sensorData.radar.reflectivity += (Math.random() - 0.5) * 2;
  state.sensorData.radar.reflectivity = Math.max(40, Math.min(80, state.sensorData.radar.reflectivity));
  state.sensorData.radar.radial_velocity += (Math.random() - 0.5) * 1;
  state.sensorData.radar.radial_velocity = Math.max(-15, Math.min(15, state.sensorData.radar.radial_velocity));
  
  // Update Anemometer
  state.sensorData.anemometer.wind_speed += (Math.random() - 0.5) * 1;
  state.sensorData.anemometer.wind_speed = Math.max(0, Math.min(30, state.sensorData.anemometer.wind_speed));
  state.sensorData.anemometer.wind_direction += (Math.random() - 0.5) * 5;
  state.sensorData.anemometer.wind_direction = (state.sensorData.anemometer.wind_direction + 360) % 360;
  state.sensorData.anemometer.temperature += (Math.random() - 0.5) * 0.2;
  state.sensorData.anemometer.pressure += (Math.random() - 0.5) * 0.5;
}

function updateWeatherMetrics() {
  document.getElementById('tempValue').textContent = `${state.sensorData.anemometer.temperature.toFixed(1)}°C`;
  document.getElementById('pressureValue').textContent = `${state.sensorData.anemometer.pressure.toFixed(1)} hPa`;
  document.getElementById('windValue').textContent = `${state.sensorData.anemometer.wind_speed.toFixed(1)} m/s`;
}

function updateCharts() {
  // Update reflectivity history
  state.reflectivityHistory.shift();
  state.reflectivityHistory.push(state.sensorData.radar.reflectivity);
  
  state.velocityHistory.shift();
  state.velocityHistory.push(state.sensorData.radar.radial_velocity);
  
  state.timeLabels.shift();
  state.timeLabels.push('0s');
  
  // Update chart
  if (state.charts.reflectivity) {
    state.charts.reflectivity.data.datasets[0].data = [...state.reflectivityHistory];
    state.charts.reflectivity.data.datasets[1].data = [...state.velocityHistory];
    state.charts.reflectivity.update('none');
  }
  
  // Update LIDAR charts
  if (state.charts.lidarVelocity) {
    state.charts.lidarVelocity.data.datasets[0].data = [...state.sensorData.lidar.vertical_velocities];
    state.charts.lidarVelocity.update('none');
  }
  
  if (state.charts.lidarBackscatter) {
    state.charts.lidarBackscatter.data.datasets[0].data = [...state.sensorData.lidar.backscatter];
    state.charts.lidarBackscatter.update('none');
  }
  
  // Update radar charts
  if (state.charts.radarReflectivity) {
    state.charts.radarReflectivity.data.datasets[0].data.shift();
    state.charts.radarReflectivity.data.datasets[0].data.push(state.sensorData.radar.reflectivity);
    state.charts.radarReflectivity.update('none');
  }
  
  if (state.charts.radarSpectrum) {
    state.charts.radarSpectrum.data.datasets[0].data.shift();
    state.charts.radarSpectrum.data.datasets[0].data.push(2 + Math.random() * 3);
    state.charts.radarSpectrum.update('none');
  }
  
  // Update anemometer chart
  if (state.charts.anemometerWind) {
    state.charts.anemometerWind.data.datasets[0].data.shift();
    state.charts.anemometerWind.data.datasets[0].data.push(state.sensorData.anemometer.wind_speed);
    state.charts.anemometerWind.update('none');
  }
}

function generateNewDetection() {
  const severities = ['LOW', 'MODERATE', 'SEVERE', 'EXTREME'];
  const methods = ['LIDAR', 'DOPPLER_RADAR', 'ANEMOMETER', 'FUSION'];
  const weights = [0.5, 0.3, 0.15, 0.05]; // Probability weights
  
  let severity;
  const rand = Math.random();
  if (rand < weights[0]) severity = severities[0];
  else if (rand < weights[0] + weights[1]) severity = severities[1];
  else if (rand < weights[0] + weights[1] + weights[2]) severity = severities[2];
  else severity = severities[3];
  
  const detection = {
    event_id: `evt_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    latitude: AIRPORT.latitude + (Math.random() - 0.5) * 0.05,
    longitude: AIRPORT.longitude + (Math.random() - 0.5) * 0.05,
    altitude: 500 + Math.random() * 2000,
    severity: severity,
    confidence: 0.7 + Math.random() * 0.3,
    max_wind_shear: 3 + Math.random() * 12,
    vertical_velocity: -3 - Math.random() * 8,
    detection_method: methods[Math.floor(Math.random() * methods.length)],
    duration: 30 + Math.random() * 120
  };
  
  state.detections.unshift(detection);
  
  // Show toast for critical detections
  if (severity === 'SEVERE' || severity === 'EXTREME') {
    showToast(
      `Nueva detección ${severity}: Cizalladura ${detection.max_wind_shear.toFixed(1)} m/s`,
      'error'
    );
  }
  
  // Update map if in monitoring view
  if (state.currentView === 'monitoring') {
    updateMap();
  }
}

function updateSystemTime() {
  const now = new Date();
  document.getElementById('systemTime').textContent = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Export Functions
function exportToCSV() {
  const startDate = document.getElementById('exportStartDate').value;
  const endDate = document.getElementById('exportEndDate').value;
  
  const csv = [
    ['ID', 'Timestamp', 'Severidad', 'Confianza', 'Cizalladura', 'Velocidad Vertical', 'Método'].join(','),
    ...state.detections.map(d => [
      d.event_id,
      d.timestamp,
      d.severity,
      (d.confidence * 100).toFixed(0),
      d.max_wind_shear.toFixed(1),
      d.vertical_velocity.toFixed(1),
      d.detection_method
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detecciones_${startDate}_${endDate}.csv`;
  a.click();
  
  showToast('Datos exportados a CSV exitosamente', 'success');
}

function exportToJSON() {
  const startDate = document.getElementById('exportStartDate').value;
  const endDate = document.getElementById('exportEndDate').value;
  
  const json = JSON.stringify(state.detections, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detecciones_${startDate}_${endDate}.json`;
  a.click();
  
  showToast('Datos exportados a JSON exitosamente', 'success');
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}