const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FORTNITE_API_KEY;
const BASE_URL = 'https://fortniteapi.io';

const dirs = ['battlepasses', 'challenges', 'seasons', 'weapons', 'fish', 'poi', 'vehicles'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function fetchData(endpoint) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { 'Authorization': API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBattlepass(season) {
  const filePath = path.join('battlepasses', `season_${season}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Battlepass Season ${season} already exists`);
    return true;
  }
  console.log(`Fetching Battlepass Season ${season}...`);
  const data = await fetchData(`/v2/battlepass?lang=en&season=${season}`);
  if (data && data.result) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Battlepass Season ${season} saved`);
    return true;
  }
  console.log(`✗ Battlepass Season ${season} not available`);
  return false;
}

async function getChallenges(season) {
  const filePath = path.join('challenges', `season_${season}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Challenges Season ${season} already exists`);
    return true;
  }
  console.log(`Fetching Challenges Season ${season}...`);
  const data = await fetchData(`/v3/challenges?season=${season}&lang=en`);
  if (data && data.result !== false) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Challenges Season ${season} saved`);
    return true;
  }
  console.log(`✗ Challenges Season ${season} not available`);
  return false;
}

async function getSeasonsList() {
  const filePath = path.join('seasons', 'seasons_list.json');
  console.log('Fetching Seasons List...');
  const data = await fetchData('/v1/seasons/list?lang=en');
  if (data && data.seasons) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('✓ Seasons List saved');
    return data.seasons;
  }
  console.log('✗ Seasons List not available');
  return [];
}

async function getWeapons() {
  const filePath = path.join('weapons', 'weapons_list.json');
  if (fs.existsSync(filePath)) {
    console.log('✓ Weapons list already exists');
    return true;
  }
  console.log('Fetching Weapons list...');
  const data = await fetchData('/v1/weapons/list');
  if (data && data.result !== false) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('✓ Weapons list saved');
    return true;
  }
  console.log('✗ Weapons list not available');
  return false;
}

async function getFish(season) {
  const filePath = path.join('fish', `season_${season}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Fish Season ${season} already exists`);
    return true;
  }
  console.log(`Fetching Fish Season ${season}...`);
  const data = await fetchData(`/v1/loot/fish?lang=en&season=${season}`);
  if (data && data.result !== false) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Fish Season ${season} saved`);
    return true;
  }
  console.log(`✗ Fish Season ${season} not available`);
  return false;
}

async function getPOI(gameVersion) {
  const versionSafe = gameVersion.replace(/\./g, '_');
  const filePath = path.join('poi', `poi_${versionSafe}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ POI ${gameVersion} already exists`);
    return true;
  }
  console.log(`Fetching POI for game version ${gameVersion}...`);
  const data = await fetchData(`/v2/game/poi?lang=en&gameVersion=${gameVersion}`);
  if (data && data.result !== false) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ POI ${gameVersion} saved`);
    return true;
  }
  console.log(`✗ POI ${gameVersion} not available`);
  return false;
}

async function getVehicles() {
  const filePath = path.join('vehicles', 'vehicles.json');
  if (fs.existsSync(filePath)) {
    console.log('✓ Vehicles already exist');
    return true;
  }
  console.log('Fetching Vehicles...');
  const data = await fetchData('/v2/game/vehicles');
  if (data && data.result !== false) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('✓ Vehicles saved');
    return true;
  }
  console.log('✗ Vehicles not available');
  return false;
}

function extractGameVersions(seasons) {
  const seen = new Set();
  const versions = [];

  for (const season of seasons) {
    for (const patch of season.patchList || []) {
      const raw = patch.version || '';
      const match = raw.match(/^(\d+\.\d+)/);
      if (!match) continue;
      const clean = match[1];
      if (!seen.has(clean)) {
        seen.add(clean);
        versions.push(clean);
      }
    }
  }

  return versions.sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
  });
}

function generateReadme(gameVersions) {
  const battlepasses = fs.readdirSync('battlepasses')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);

  const challenges = fs.readdirSync('challenges')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);

  const fishSeasons = fs.readdirSync('fish')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);

  const poiFiles = fs.readdirSync('poi')
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('poi_', '').replace('.json', '').replace(/_/g, '.'))
    .sort((a, b) => {
      const [aMaj, aMin] = a.split('.').map(Number);
      const [bMaj, bMin] = b.split('.').map(Number);
      return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
    });

  let readme = `# Fortnite Data Archive

Fortnite data obtained from [FortniteAPI.io](https://fortniteapi.io/)

## 📊 Available Data

### Battle Passes (${battlepasses.length} seasons)
`;
  battlepasses.forEach(s => { readme += `- [Season ${s}](battlepasses/season_${s}.json)\n`; });

  readme += `\n### Challenges (${challenges.length} seasons)\n`;
  challenges.forEach(s => { readme += `- [Season ${s}](challenges/season_${s}.json)\n`; });

  readme += `\n### Fish (${fishSeasons.length} seasons, from Season 11)\n`;
  fishSeasons.forEach(s => { readme += `- [Season ${s}](fish/season_${s}.json)\n`; });

  readme += `\n### POI (${poiFiles.length} game versions)\n`;
  poiFiles.forEach(v => {
    const safe = v.replace(/\./g, '_');
    readme += `- [Version ${v}](poi/poi_${safe}.json)\n`;
  });

  readme += `\n### Weapons
- [Weapons List](weapons/weapons_list.json)

### Vehicles
- [Vehicles](vehicles/vehicles.json)

### Seasons Info
- [Complete list of seasons](seasons/seasons_list.json)

## 🔄 Updates

The data is automatically updated every week via GitHub Actions.

**Last update:** ${new Date().toISOString().split('T')[0]}

## 📝 Data Source

All data comes from [FortniteAPI.io](https://fortniteapi.io)
`;

  fs.writeFileSync('README.md', readme);
  console.log('✓ README.md generated');
}

async function main() {
  console.log('🎮 Starting Fortnite Data Fetcher...\n');

  const seasons = await getSeasonsList();
  await delay(1000);

  console.log('\n🔫 Fetching Weapons...');
  await getWeapons();
  await delay(1000);

  console.log('\n🚗 Fetching Vehicles...');
  await getVehicles();
  await delay(1000);

  console.log('\n📦 Fetching Battle Passes...');
  for (let season = 1; season <= 38; season++) {
    await getBattlepass(season);
    await delay(1000);
  }

  console.log('\n🎯 Fetching Challenges...');
  for (let season = 1; season <= 38; season++) {
    await getChallenges(season);
    await delay(1000);
  }

  console.log('\n🐟 Fetching Fish...');
  for (let season = 11; season <= 38; season++) {
    await getFish(season);
    await delay(1000);
  }

  console.log('\n🗺️  Fetching POI...');
  const gameVersions = extractGameVersions(seasons);
  console.log(`Found ${gameVersions.length} unique game versions`);
  for (const version of gameVersions) {
    await getPOI(version);
    await delay(1000);
  }

  console.log('\n📝 Generating README...');
  generateReadme(gameVersions);

  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
