import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

const dataPath = path.join(process.cwd(), 'server', 'providers.json');
const providers = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get('/providers/search', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.json(providers);
  }
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const results = providers
    .map((p) => ({
      ...p,
      distance: calculateDistance(latitude, longitude, p.lat, p.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .filter((p) => p.distance <= 50);
  res.json(results);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server listening on ${PORT}`);
});
