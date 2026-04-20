const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://fnapi.osirion.gg';

const dirs = ['season-passes', 'quests', 'maps', 'seasons', 'weapons', 'fish', 'poi', 'vehicles'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function fetchData(endpoint, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSeasonPasses(season) {
  const filePath = path.join('season-passes', `season_${season}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Season Passes Season ${season} already exist`);
    return true;
  }
  console.log(`Fetching Season Passes for Season ${season}...`);
  const data = await fetchData('/v1/season-passes', { lang: 'en', season });
  if (data && data.success && data.seasonPasses && data.seasonPasses.length > 0) {
    const matched = data.seasonPasses.some(p => p.seasonNumber === season);
    if (!matched) {
      console.log(`✗ Season Passes Season ${season} not available`);
      return false;
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    const modes = data.seasonPasses.map(p => p.modeId).join(', ');
    console.log(`✓ Season Passes Season ${season} saved (${data.seasonPasses.length} passes: ${modes})`);
    return true;
  }
  console.log(`✗ Season Passes Season ${season} not available`);
  return false;
}

async function getQuests(season) {
  const filePath = path.join('quests', `season_${season}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Quests Season ${season} already exist`);
    return true;
  }
  console.log(`Fetching Quests for Season ${season}...`);
  const data = await fetchData('/v1/quests', { lang: 'en', season });
  if (data && data.success && data.questBundles && data.questBundles.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Quests Season ${season} saved (${data.questBundles.length} bundles)`);
    return true;
  }
  console.log(`✗ Quests Season ${season} not available`);
  return false;
}

async function getMap(gameVersion) {
  const versionSafe = gameVersion.replace(/\./g, '_');
  const filePath = path.join('maps', `map_${versionSafe}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Map ${gameVersion} already exists`);
    return true;
  }
  console.log(`Fetching Map for game version ${gameVersion}...`);
  const data = await fetchData('/v1/maps', { lang: 'en', gameVersion });
  if (data && data.success && data.maps && data.maps.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    const modes = data.maps.map(m => m.id).join(', ');
    console.log(`✓ Map ${gameVersion} saved (${data.maps.length} modes: ${modes})`);
    return true;
  }
  console.log(`✗ Map ${gameVersion} not available`);
  return false;
}

async function getSeasonsList() {
  const filePath = path.join('seasons', 'seasons_list.json');
  console.log('Fetching Seasons List...');
  const data = await fetchData('/v1/seasons/list', { lang: 'en' });
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
  const data = await fetchData('/v1/loot/fish', { lang: 'en', season });
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
  const data = await fetchData('/v2/game/poi', { lang: 'en', gameVersion });
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
  const seasonPassFiles = fs.readdirSync('season-passes')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);

  const questFiles = fs.readdirSync('quests')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);

  const mapFiles = fs.readdirSync('maps')
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('map_', '').replace('.json', '').replace(/_/g, '.'))
    .sort((a, b) => {
      const [aMaj, aMin] = a.split('.').map(Number);
      const [bMaj, bMin] = b.split('.').map(Number);
      return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
    });

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

  function getModesForSeason(season) {
    try {
      const filePath = path.join('season-passes', `season_${season}.json`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return (data.seasonPasses || []).map(p => p.modeId).join(', ');
    } catch {
      return '';
    }
  }

  let readme = `# Fortnite Data Archive

Fortnite data obtained from [fnapi.osirion.gg](https://fnapi.osirion.gg)

## 📊 Available Data

### Season Passes (${seasonPassFiles.length} seasons)
> Each file contains all passes for that season (Battle Royale, LEGO, Festival, Rocket Racing, etc.)

`;
  seasonPassFiles.forEach(s => {
    const modes = getModesForSeason(s);
    readme += `- [Season ${s}](season-passes/season_${s}.json)${modes ? ` — \`${modes}\`` : ''}\n`;
  });

  readme += `\n### Quests (${questFiles.length} seasons)\n`;
  questFiles.forEach(s => { readme += `- [Season ${s}](quests/season_${s}.json)\n`; });

  readme += `\n### Maps (${mapFiles.length} game versions)\n`;
  mapFiles.forEach(v => {
    const safe = v.replace(/\./g, '_');
    readme += `- [Version ${v}](maps/map_${safe}.json)\n`;
  });

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

All data comes from [fnapi.osirion.gg](https://fnapi.osirion.gg) & fortniteapi.io
`;

  fs.writeFileSync('README.md', readme);
  console.log('✓ README.md generated');
}

async function main() {
  console.log('🎮 Starting Fortnite Data Fetcher...\n');

  const seasons = await getSeasonsList();
  await delay(1000);

  const gameVersions = extractGameVersions(seasons);
  console.log(`Found ${gameVersions.length} unique game versions`);

  console.log('\n🔫 Fetching Weapons...');
  await getWeapons();
  await delay(1000);

  console.log('\n🚗 Fetching Vehicles...');
  await getVehicles();
  await delay(1000);

  console.log('\n🎫 Fetching Season Passes...');
  for (let season = 1; season <= 40; season++) {
    await getSeasonPasses(season);
    await delay(1000);
  }

  console.log('\n📋 Fetching Quests...');
  for (let season = 1; season <= 40; season++) {
    await getQuests(season);
    await delay(1000);
  }

  console.log('\n🐟 Fetching Fish...');
  for (let season = 11; season <= 40; season++) {
    await getFish(season);
    await delay(1000);
  }

  console.log('\n🗺️  Fetching POI...');
  for (const version of gameVersions) {
    await getPOI(version);
    await delay(1000);
  }

  console.log('\n🗺️  Fetching Maps...');
  for (const version of gameVersions) {
    await getMap(version);
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
