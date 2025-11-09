const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FORTNITE_API_KEY;
const BASE_URL = 'https://fortniteapi.io';

const dirs = ['battlepasses', 'challenges', 'seasons'];
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

function generateReadme() {
  const battlepasses = fs.readdirSync('battlepasses')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);
    
  const challenges = fs.readdirSync('challenges')
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.match(/\d+/)[0]))
    .sort((a, b) => a - b);
    
  let readme = `# Fortnite Data Repository

This repository contains historical Fortnite data obtained from FortniteAPI.io

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
  
  readme += `\n### Seasons Info
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
  
  await getSeasonsList();
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
  
  console.log('\n📝 Generating README...');
  generateReadme();
  
  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
