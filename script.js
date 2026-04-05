/**
 * Sovereign AR — Protocol Engine + Layer Loader
 * 
 * This script enforces tribal data governance protocols client-side.
 * It reads layers/manifest.json, loads approved GeoJSON layers,
 * and renders them as location-based AR entities via A-Frame + AR.js.
 * 
 * Sacred-tier content never exists as downloadable data.
 * Restricted content requires user acknowledgment.
 * All layers carry protocol metadata prohibiting AI training.
 * 
 * NO DATA LEAVES THE BROWSER. NO ANALYTICS. NO TRACKING.
 */

(function SovereignAR() {
  'use strict';

  // ── State ────────────────────────────────────
  const state = {
    manifest: null,
    layers: {},          // layerId -> GeoJSON
    activeLayers: new Set(),
    acknowledged: new Set(),  // protocols the user has acknowledged
    userPosition: null,
    demoMode: false,
    entities: [],        // A-Frame entities we've placed
    selectedFeature: null
  };

  // ── DOM refs ─────────────────────────────────
  const $ = id => document.getElementById(id);
  const loadingEl     = $('loading');
  const arScene       = $('ar-scene');
  const gpsDot        = $('gps-dot');
  const gpsStatusEl   = $('gps-status');
  const togglesEl     = $('layer-toggles');
  const featureCountEl= $('feature-count');
  const featureCard   = $('feature-card');
  const sacredWarning = $('sacred-warning');
  const demoBanner    = $('demo-banner');
  const ackModal      = $('ack-modal');

  // ── Init ─────────────────────────────────────
  async function init() {
    try {
      // Load manifest
      const res = await fetch('layers/manifest.json');
      if (!res.ok) throw new Error('Could not load manifest');
      state.manifest = await res.json();

      // Build layer toggle UI
      buildLayerToggles();

      // Try GPS — fall back to demo mode
      startGPS();

      // Hide loading after short delay
      setTimeout(() => {
        loadingEl.classList.add('hidden');
        arScene.style.display = '';
      }, 1500);

    } catch (err) {
      console.error('Sovereign AR init failed:', err);
      loadingEl.querySelector('p').textContent = 
        'Could not load layer manifest. Check that layers/manifest.json exists.';
    }
  }

  // ── GPS ──────────────────────────────────────
  function startGPS() {
    if (!navigator.geolocation) {
      enterDemoMode();
      return;
    }

    navigator.geolocation.watchPosition(
      pos => {
        state.userPosition = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        gpsDot.classList.add('active');
        gpsDot.classList.remove('error');
        gpsStatusEl.textContent = `GPS ±${Math.round(pos.coords.accuracy)}m`;
        checkProximityWarnings();
      },
      err => {
        console.warn('GPS failed, entering demo mode:', err.message);
        enterDemoMode();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function enterDemoMode() {
    state.demoMode = true;
    // Use coordinates from the first feature in the manifest's first layer
    const firstLayer = state.manifest.layers.find(l => l.file);
    if (firstLayer) {
      // We'll set a default position — layers will render nearby
      state.userPosition = { lat: 40.752, lon: -89.596, accuracy: 0 };
    } else {
      state.userPosition = { lat: 0, lon: 0, accuracy: 0 };
    }
    gpsDot.classList.add('active');
    gpsStatusEl.textContent = 'Demo Mode';
    demoBanner.style.display = '';
  }

  // ── Layer Toggle UI ──────────────────────────
  function buildLayerToggles() {
    const layers = state.manifest.layers;
    togglesEl.innerHTML = '';

    layers.forEach(layer => {
      const btn = document.createElement('button');
      btn.className = 'layer-toggle';
      btn.dataset.layerId = layer.id;
      btn.dataset.protocol = layer.protocol;
      btn.innerHTML = `
        <span class="layer-dot" style="background: ${layer.color}"></span>
        ${layer.name}
      `;

      btn.addEventListener('click', () => toggleLayer(layer));
      togglesEl.appendChild(btn);
    });

    // Auto-activate public layers
    layers.filter(l => l.protocol === 'public').forEach(l => toggleLayer(l));
  }

  async function toggleLayer(layer) {
    const btn = togglesEl.querySelector(`[data-layer-id="${layer.id}"]`);

    if (state.activeLayers.has(layer.id)) {
      // Deactivate
      state.activeLayers.delete(layer.id);
      btn.classList.remove('active');
      removeLayerEntities(layer.id);
      updateFeatureCount();
      return;
    }

    // Protocol checks before activating
    if (layer.protocol === 'sacred') {
      // Sacred layers show warning only — no actual data
      btn.classList.add('active');
      state.activeLayers.add(layer.id);
      updateFeatureCount();
      return;
    }

    if (layer.protocol === 'restricted' && !state.acknowledged.has('restricted')) {
      // Show acknowledgment modal
      showAcknowledgment(layer);
      return;
    }

    if (layer.protocol === 'seasonal') {
      if (!state.acknowledged.has('seasonal')) {
        showAcknowledgment(layer);
        return;
      }
    }

    // Load layer data
    await loadAndRenderLayer(layer);
    btn.classList.add('active');
    state.activeLayers.add(layer.id);
    updateFeatureCount();
  }

  // ── Acknowledgment ───────────────────────────
  function showAcknowledgment(layer) {
    const ackText = layer.acknowledgment_text || 
      `This content is shared under the authority of ${state.manifest.sovereignty.nation}. ` +
      `By proceeding, you acknowledge that this information may not be reproduced, extracted, ` +
      `or used for AI training, commercial purposes, or any use not explicitly authorized by the governing tribal authority.`;

    $('ack-text').textContent = ackText;
    ackModal.classList.add('visible');

    // Accept handler
    const acceptHandler = async () => {
      state.acknowledged.add(layer.protocol);
      ackModal.classList.remove('visible');
      await loadAndRenderLayer(layer);
      const btn = togglesEl.querySelector(`[data-layer-id="${layer.id}"]`);
      btn.classList.add('active');
      state.activeLayers.add(layer.id);
      updateFeatureCount();
      cleanup();
    };

    // Decline handler
    const declineHandler = () => {
      ackModal.classList.remove('visible');
      cleanup();
    };

    function cleanup() {
      $('ack-accept').removeEventListener('click', acceptHandler);
      $('ack-decline').removeEventListener('click', declineHandler);
    }

    $('ack-accept').addEventListener('click', acceptHandler);
    $('ack-decline').addEventListener('click', declineHandler);
  }

  // ── Load + Render Layer ──────────────────────
  async function loadAndRenderLayer(layer) {
    if (!layer.file) return; // Sacred layers have no file

    if (state.layers[layer.id]) {
      // Already loaded, just render
      renderGeoJSON(layer.id, state.layers[layer.id], layer);
      return;
    }

    try {
      const res = await fetch(`layers/${layer.file}`);
      if (!res.ok) throw new Error(`Failed to load ${layer.file}`);
      const geojson = await res.json();
      state.layers[layer.id] = geojson;
      renderGeoJSON(layer.id, geojson, layer);
    } catch (err) {
      console.error(`Failed to load layer ${layer.id}:`, err);
    }
  }

  function renderGeoJSON(layerId, geojson, layerConfig) {
    const scene = document.querySelector('a-scene');
    const features = geojson.features || [];

    features.forEach((feature, i) => {
      if (feature.geometry.type !== 'Point') {
        // For non-point features, use centroid
        const coords = getCentroid(feature.geometry);
        placeEntity(scene, layerId, feature, coords, layerConfig, i);
      } else {
        const coords = feature.geometry.coordinates;
        placeEntity(scene, layerId, feature, coords, layerConfig, i);
      }
    });
  }

  function placeEntity(scene, layerId, feature, coords, layerConfig, index) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('gps-new-entity-place', {
      latitude: coords[1],
      longitude: coords[0]
    });
    entity.dataset.layerId = layerId;
    entity.dataset.featureIndex = index;

    // Create a compound entity: marker + text
    const marker = document.createElement('a-sphere');
    marker.setAttribute('radius', '3');
    marker.setAttribute('material', { 
      color: layerConfig.color, 
      opacity: 0.8,
      emissive: layerConfig.color,
      emissiveIntensity: 0.3
    });
    marker.setAttribute('position', '0 3 0');

    const nameText = feature.properties.name_indigenous || 
                     feature.properties.name || 
                     feature.properties.title || 
                     'Unnamed';

    const text = document.createElement('a-text');
    text.setAttribute('value', nameText);
    text.setAttribute('align', 'center');
    text.setAttribute('scale', '40 40 40');
    text.setAttribute('position', '0 10 0');
    text.setAttribute('look-at', '[gps-new-camera]');
    text.setAttribute('color', '#fff');

    entity.appendChild(marker);
    entity.appendChild(text);

    // Click handler to show feature card
    entity.addEventListener('click', () => showFeatureCard(feature, layerConfig));

    scene.appendChild(entity);
    state.entities.push(entity);
  }

  function removeLayerEntities(layerId) {
    state.entities = state.entities.filter(e => {
      if (e.dataset.layerId === layerId) {
        e.parentNode.removeChild(e);
        return false;
      }
      return true;
    });
  }

  // ── Feature Card ─────────────────────────────
  function showFeatureCard(feature, layerConfig) {
    const p = feature.properties;
    $('fc-title').textContent = p.name_indigenous || p.name || p.title || 'Feature';
    $('fc-protocol').textContent = layerConfig.protocol.toUpperCase();
    $('fc-protocol').style.color = layerConfig.color;

    const bodyParts = [];
    if (p.meaning) bodyParts.push(`Meaning: ${p.meaning}`);
    if (p.description) bodyParts.push(p.description);
    if (p.narrative) bodyParts.push(p.narrative);
    if (p.stewardship_note) bodyParts.push(`Stewardship: ${p.stewardship_note}`);
    $('fc-body').textContent = bodyParts.join('\n\n') || 'No additional information.';

    const attr = p.attributed_to || p.narrator;
    $('fc-attribution').textContent = attr ? `Attributed to: ${attr}` : 
      `Shared under sovereign authority of ${state.manifest.sovereignty.nation}`;

    featureCard.classList.add('visible');
  }

  $('feature-close').addEventListener('click', () => {
    featureCard.classList.remove('visible');
  });

  // ── Sacred Proximity Warnings ────────────────
  function checkProximityWarnings() {
    if (!state.userPosition) return;

    const sacredLayers = state.manifest.layers.filter(l => l.protocol === 'sacred');
    sacredLayers.forEach(layer => {
      if (!state.activeLayers.has(layer.id)) return;
      if (layer.warning_only && layer.warning_text) {
        // In a real implementation, this would check distance to sacred zone centers
        // For the template, we show how the warning mechanism works
        // Uncomment and configure with actual coordinates when deploying
      }
    });
  }

  // Demo: show sacred warning on button
  function showSacredWarning(text) {
    $('sacred-warning-text').textContent = text;
    sacredWarning.classList.add('visible');
    setTimeout(() => sacredWarning.classList.remove('visible'), 8000);
  }

  // ── Utility ──────────────────────────────────
  function getCentroid(geometry) {
    if (geometry.type === 'LineString') {
      const mid = Math.floor(geometry.coordinates.length / 2);
      return geometry.coordinates[mid];
    }
    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates[0];
      let lat = 0, lon = 0;
      ring.forEach(c => { lon += c[0]; lat += c[1]; });
      return [lon / ring.length, lat / ring.length];
    }
    return [0, 0];
  }

  function updateFeatureCount() {
    let total = 0;
    state.activeLayers.forEach(id => {
      const layer = state.manifest.layers.find(l => l.id === id);
      if (layer && layer.protocol === 'sacred') {
        total += 1; // warning zone
      } else if (state.layers[id]) {
        total += (state.layers[id].features || []).length;
      }
    });

    const active = state.activeLayers.size;
    featureCountEl.textContent = active > 0 
      ? `${active} layer${active > 1 ? 's' : ''} active · ${total} feature${total !== 1 ? 's' : ''}`
      : 'Tap a layer to activate';
  }

  // ── Boot ─────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for demo/testing
  window.SovereignAR = {
    showSacredWarning,
    getState: () => state
  };

})();
