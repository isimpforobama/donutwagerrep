// Simple file-based storage server for Plinko paths
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PATHS_FILE = path.join(DATA_DIR, 'plinko_paths.json');
const PROBS_FILE = path.join(DATA_DIR, 'plinko_probabilities.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty files if they don't exist
if (!fs.existsSync(PATHS_FILE)) {
  fs.writeFileSync(PATHS_FILE, JSON.stringify({ 8: {}, 12: {}, 16: {} }, null, 2));
}
if (!fs.existsSync(PROBS_FILE)) {
  fs.writeFileSync(PROBS_FILE, JSON.stringify({
    8: [1, 4, 12, 24, 26, 24, 12, 4, 1],
    12: [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
    16: [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
  }, null, 2));
}

function readPaths() {
  try {
    const data = fs.readFileSync(PATHS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading paths file:', e);
    return { 8: {}, 12: {}, 16: {} };
  }
}

function writePaths(paths) {
  try {
    fs.writeFileSync(PATHS_FILE, JSON.stringify(paths, null, 2));
    console.log('Paths saved to', PATHS_FILE);
    return true;
  } catch (e) {
    console.error('Error writing paths file:', e);
    return false;
  }
}

function readProbabilities() {
  try {
    const data = fs.readFileSync(PROBS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading probabilities file:', e);
    return {
      8: [1, 4, 12, 24, 26, 24, 12, 4, 1],
      12: [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
      16: [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
    };
  }
}

function writeProbabilities(probs) {
  try {
    fs.writeFileSync(PROBS_FILE, JSON.stringify(probs, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing probabilities file:', e);
    return false;
  }
}

module.exports = {
  readPaths,
  writePaths,
  readProbabilities,
  writeProbabilities,
  PATHS_FILE,
  PROBS_FILE
};
