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
      headers: {
        'Authorization': API_KEY
      }
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
  } else {
    console.log(`✗ Battlepass Season ${season} not available`);
    return false;
  }
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
  } else {
    console.log(`✗ Challenges Season ${season} not available`);
    return false;
  }
}

async function getSeasonsList() {
  const filePath = path.join('seasons', 'seasons_list.json');
  
  console.log('Fetching Seasons List...');
  const data = await fetchData('/v1/seasons/list?lang=en');
  
  if (data && data.seasons) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('✓ Seasons List saved');
    return data.seasons;
  } else {
    console.log('✗ Seasons List not available');
    return [];
  }
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
  } else {
    console.log('✗ Weapons list not available');
    return false;
  }
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
  } else {
    console.log(`✗ Fish Season ${season} not available`);
    return false;
  }
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
  } else {
    console.log(`✗ POI ${gameVersion} not available`);
    return false;
  }
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
  } else {
    console.log('✗ Vehicles not available');
    return false;
  }
}

function extractGameVersions(seasons) {
  const versions = new Set();
  for (const season of seasons) {
    const candidates = [
      season.gameVersion,
      season.patchVersion,
      season.version,
    ];
    for (const v of candidates) {
      if (v && typeof v === 'string' && /^\d+\.\d+$/.test(v.trim())) {
        versions.add(v.trim());
      }
    }
  }
  return [...versions].sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
  });
}

function generateReadme() {
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
    .sort();
    
  let readme = `# Fortnite Data Archive

Fortnite data obtained from [FortniteAPI.io](https://fortniteapi.io/)

## 📊 Available Data

### Battle Passes (${battlepasses.length} seasons)
`;

  battlepasses.forEach(season => {
    readme += `- [Season ${season}](battlepasses/season_${season}.json)\n`;
  });
  
  readme += `\n### Challenges (${challenges.length} seasons)\n`;
  challenges.forEach(season => {
    readme += `- [Season ${season}](challenges/season_${season}.json)\n`;
  });

  readme += `\n### Fish (${fishSeasons.length} seasons, from Season 11)\n`;
  fishSeasons.forEach(season => {
    readme += `- [Season ${season}](fish/season_${season}.json)\n`;
  });

  readme += `\n### POI (${poiFiles.length} game versions)\n`;
  poiFiles.forEach(version => {
    const safe = version.replace(/\./g, '_');
    readme += `- [Version ${version}](poi/poi_${safe}.json)\n`;
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
  console.log('README.md  created');
}

async function main() {
  console.log('Loading...\n');
  
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
  if (gameVersions.length === 0) {
    console.log('⚠️  No game versions found in seasons list. Skipping POI fetch.');
  } else {
    console.log(`Found ${gameVersions.length} game versions: ${gameVersions.join(', ')}`);
    for (const version of gameVersions) {
      await getPOI(version);
      await delay(1000);
    }
  }
  
  generateReadme();
  
  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
