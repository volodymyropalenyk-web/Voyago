const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Geocode (Nominatim) ──────────────────────────────────────────────────────
app.get('/api/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Voyago Travel Planner/1.0' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Geocode error:', err);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

// ── Attractions (Wikipedia geosearch) ────────────────────────────────────────
app.get('/api/attractions', async (req, res) => {
  try {
    const { lat, lon, lang = 'en' } = req.query;
    const wikiLang = lang === 'uk' ? 'uk' : 'en';
    const url = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=12&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data?.query?.geosearch || []);
  } catch (err) {
    console.error('Attractions error:', err);
    res.json([]);
  }
});

// ── Holidays (Nager.Date) ─────────────────────────────────────────────────────
app.get('/api/holidays', async (req, res) => {
  try {
    const { countryCode, year } = req.query;
    if (!countryCode || countryCode === 'undefined') return res.json([]);
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
    const response = await fetch(url);
    // 204 = country not supported by Nager.Date
    if (!response.ok || response.status === 204) return res.json([]);
    const text = await response.text();
    if (!text || text.trim() === '') return res.json([]);
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('Holidays error:', err);
    res.json([]);
  }
});

// ── Weather (wttr.in) ─────────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  try {
    const { city } = req.query;
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Weather error:', err);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

// ── Route / Distance ──────────────────────────────────────────────────────────
// Returns { drive, flight }
// drive = OSRM road route (null if cross-ocean / not possible)
// flight = great-circle straight line (always present)
app.get('/api/route', async (req, res) => {
  try {
    const { from_lon, from_lat, to_lon, to_lat } = req.query;

    // Great-circle (straight-line) distance
    const R = 6371;
    const lat1 = parseFloat(from_lat) * Math.PI / 180;
    const lat2 = parseFloat(to_lat)   * Math.PI / 180;
    const dLat = (parseFloat(to_lat)  - parseFloat(from_lat)) * Math.PI / 180;
    const dLon = (parseFloat(to_lon)  - parseFloat(from_lon)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const flight = {
      distance_km: Math.round(straight),
      duration_h:  parseFloat((straight / 850).toFixed(1)),
      duration_min: Math.round(straight / 850 * 60),
    };

    // Try OSRM driving (5 s timeout)
    let drive = null;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from_lon},${from_lat};${to_lon},${to_lat}?overview=false`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await resp.json();
      if (data.routes?.[0]) {
        const r = data.routes[0];
        drive = {
          distance_km: parseFloat((r.distance / 1000).toFixed(1)),
          duration_h:  parseFloat((r.duration / 3600).toFixed(1)),
          duration_min: Math.round(r.duration / 60),
          estimated: false,
        };
      }
    } catch { /* OSRM unavailable or cross-ocean — drive stays null */ }

    // Short-distance driving estimate when OSRM fails (≤800 km straight)
    if (!drive && straight <= 800) {
      const road = straight * 1.3;
      drive = {
        distance_km: parseFloat(road.toFixed(1)),
        duration_h:  parseFloat((road / 80).toFixed(1)),
        duration_min: Math.round(road / 80 * 60),
        estimated: true,
      };
    }

    res.json({ drive, flight });
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Route calculation failed' });
  }
});

// ── Exchange Rates (open.er-api.com) ─────────────────────────────────────────
app.get('/api/exchange', async (req, res) => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/EUR');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Exchange rate fetch failed' });
  }
});

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, response) => {
    response.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🌍 Voyago server running on port ${PORT}`);
});
