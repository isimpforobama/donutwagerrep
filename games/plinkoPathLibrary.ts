// Plinko Path Recording Library
// Stores pre-recorded ball paths using FILE-BASED storage via API
// This ensures paths persist even if browser cache is cleared

export interface Position {
  x: number;
  y: number;
}

export interface RecordedPath {
  positions: Position[];
  finalBucket: number;
}

export interface PathLibrary {
  [rows: string]: {
    [bucket: string]: RecordedPath[];
  };
}

export interface BucketProbabilities {
  [rows: string]: number[];
}

const PATHS_PER_BUCKET = 6;

// In-memory cache (synced with file on disk)
let pathLibraryCache: PathLibrary = { "8": {}, "12": {}, "16": {} };
let probabilitiesCache: BucketProbabilities = {
  "8": [1, 4, 12, 24, 26, 24, 12, 4, 1],
  "12": [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
  "16": [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
};

let isLoaded = false;

// ==================== FILE API FUNCTIONS ====================

async function fetchPathsFromFile(): Promise<PathLibrary> {
  try {
    const response = await fetch('/api/plinko/paths');
    if (response.ok) {
      const data = await response.json();
      console.log('[PathLib] Loaded paths from FILE');
      return data;
    }
  } catch (e) {
    console.error('[PathLib] Failed to fetch paths from file:', e);
  }
  return { "8": {}, "12": {}, "16": {} };
}

async function savePathsToFile(paths: PathLibrary): Promise<boolean> {
  try {
    const bodyStr = JSON.stringify(paths);
    console.log('[PathLib] Attempting to save paths, size:', bodyStr.length, 'bytes');
    
    // Count paths being saved
    const counts = {
      8: Object.values(paths["8"] || {}).flat().length,
      12: Object.values(paths["12"] || {}).flat().length,
      16: Object.values(paths["16"] || {}).flat().length,
    };
    console.log('[PathLib] Saving path counts:', counts);
    
    const response = await fetch('/api/plinko/paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });
    
    if (response.ok) {
      console.log('[PathLib] ✓ SAVED paths to FILE on disk successfully');
      return true;
    } else {
      console.error('[PathLib] ✗ Save failed with status:', response.status);
    }
  } catch (e) {
    console.error('[PathLib] ✗ Failed to save paths to file:', e);
  }
  return false;
}

async function fetchProbabilitiesFromFile(): Promise<BucketProbabilities> {
  try {
    const response = await fetch('/api/plinko/probabilities');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('[PathLib] Failed to fetch probabilities:', e);
  }
  return {
    "8": [1, 4, 12, 24, 26, 24, 12, 4, 1],
    "12": [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
    "16": [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
  };
}

async function saveProbabilitiesToFile(probs: BucketProbabilities): Promise<boolean> {
  try {
    const response = await fetch('/api/plinko/probabilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(probs)
    });
    return response.ok;
  } catch (e) {
    console.error('[PathLib] Failed to save probabilities:', e);
  }
  return false;
}

// ==================== PUBLIC API ====================

export const loadLibrary = async (): Promise<void> => {
  console.log('[PathLib] Loading library from FILE on disk...');
  const loadedPaths = await fetchPathsFromFile();
  const loadedProbs = await fetchProbabilitiesFromFile();
  
  // Merge loaded data with existing cache (don't overwrite if we have more data locally)
  for (const rows of ['8', '12', '16']) {
    if (!pathLibraryCache[rows]) {
      pathLibraryCache[rows] = {};
    }
    
    const loadedRowData = loadedPaths[rows] || {};
    for (const bucket of Object.keys(loadedRowData)) {
      const loadedBucketPaths = loadedRowData[bucket] || [];
      const cacheBucketPaths = pathLibraryCache[rows][bucket] || [];
      
      // Only use loaded data if it has MORE paths than cache
      if (loadedBucketPaths.length > cacheBucketPaths.length) {
        pathLibraryCache[rows][bucket] = loadedBucketPaths;
      }
    }
    
    // Also check if loaded has buckets we don't have
    for (const bucket of Object.keys(loadedRowData)) {
      if (!pathLibraryCache[rows][bucket]) {
        pathLibraryCache[rows][bucket] = loadedRowData[bucket];
      }
    }
  }
  
  // For probabilities, just use loaded
  probabilitiesCache = loadedProbs;
  isLoaded = true;
  
  const stats = {
    8: Object.values(pathLibraryCache["8"] || {}).flat().length,
    12: Object.values(pathLibraryCache["12"] || {}).flat().length,
    16: Object.values(pathLibraryCache["16"] || {}).flat().length,
  };
  console.log('[PathLib] Library loaded from file, merged stats:', stats);
};

export const ensureLoaded = async (): Promise<void> => {
  if (!isLoaded) {
    await loadLibrary();
  }
};

export const saveLibrary = async (): Promise<void> => {
  await savePathsToFile(pathLibraryCache);
};

export const saveProbabilities = async (): Promise<void> => {
  await saveProbabilitiesToFile(probabilitiesCache);
};

export const clearLibrary = async (): Promise<void> => {
  pathLibraryCache = { "8": {}, "12": {}, "16": {} };
  await savePathsToFile(pathLibraryCache);
  console.log('[PathLib] Cleared entire path library');
};

export const clearLibraryForRows = async (rows: number): Promise<void> => {
  pathLibraryCache[String(rows)] = {};
  await savePathsToFile(pathLibraryCache);
  console.log(`[PathLib] Cleared path library for ${rows} rows`);
};

export const getBucketProbabilities = (rows: number): number[] => {
  return probabilitiesCache[String(rows)] || [];
};

export const setBucketProbabilities = async (rows: number, newProbs: number[]): Promise<void> => {
  probabilitiesCache[String(rows)] = newProbs;
  await saveProbabilitiesToFile(probabilitiesCache);
  console.log(`[PathLib] Updated probabilities for ${rows} rows`);
};

export const resetProbabilities = async (): Promise<void> => {
  probabilitiesCache = {
    "8": [1, 4, 12, 24, 26, 24, 12, 4, 1],
    "12": [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
    "16": [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
  };
  await saveProbabilitiesToFile(probabilitiesCache);
  console.log('[PathLib] Reset probabilities to defaults');
};

export const selectBucketByProbability = (rows: number, bucketCount: number): number => {
  const probs = getBucketProbabilities(rows);
  if (!probs || probs.length !== bucketCount) {
    return Math.floor(Math.random() * bucketCount);
  }
  
  const totalWeight = probs.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < probs.length; i++) {
    random -= probs[i];
    if (random <= 0) {
      return i;
    }
  }
  
  return bucketCount - 1;
};

export const hasEnoughPaths = (rows: number, bucketCount: number): boolean => {
  const lib = pathLibraryCache[String(rows)] || {};
  
  for (let i = 0; i < bucketCount; i++) {
    const paths = lib[String(i)];
    if (!paths || paths.length < PATHS_PER_BUCKET) {
      console.log(`[PathLib] hasEnoughPaths: bucket ${i} has ${paths?.length || 0}/${PATHS_PER_BUCKET}`);
      return false;
    }
  }
  console.log(`[PathLib] hasEnoughPaths: All ${bucketCount} buckets have ${PATHS_PER_BUCKET}+ paths`);
  return true;
};

export const getPathCount = (rows: number, bucket: number): number => {
  return pathLibraryCache[String(rows)]?.[String(bucket)]?.length || 0;
};

export const bucketNeedsPaths = (rows: number, bucket: number): boolean => {
  return getPathCount(rows, bucket) < PATHS_PER_BUCKET;
};

export const addPath = async (rows: number, path: RecordedPath, skipSave = false): Promise<boolean> => {
  const rowKey = String(rows);
  const bucketKey = String(path.finalBucket);
  
  if (!pathLibraryCache[rowKey]) {
    pathLibraryCache[rowKey] = {};
  }
  
  if (!pathLibraryCache[rowKey][bucketKey]) {
    pathLibraryCache[rowKey][bucketKey] = [];
  }
  
  if (pathLibraryCache[rowKey][bucketKey].length >= PATHS_PER_BUCKET) {
    return false;
  }
  
  pathLibraryCache[rowKey][bucketKey].push(path);
  
  // Only save to file if not skipping (for batch operations)
  if (!skipSave) {
    await savePathsToFile(pathLibraryCache);
  }
  
  return true;
};

// Batch add multiple paths and save once at the end
export const addPathsBatch = async (rows: number, paths: RecordedPath[]): Promise<number> => {
  console.log(`[PathLib] addPathsBatch called for ${rows} rows with ${paths.length} paths`);
  
  const rowKey = String(rows);
  let added = 0;
  
  if (!pathLibraryCache[rowKey]) {
    pathLibraryCache[rowKey] = {};
  }
  
  for (const path of paths) {
    const bucketKey = String(path.finalBucket);
    
    if (!pathLibraryCache[rowKey][bucketKey]) {
      pathLibraryCache[rowKey][bucketKey] = [];
    }
    
    if (pathLibraryCache[rowKey][bucketKey].length < PATHS_PER_BUCKET) {
      pathLibraryCache[rowKey][bucketKey].push(path);
      added++;
    }
  }
  
  console.log(`[PathLib] Added ${added} paths to cache, now saving...`);
  
  // Save all at once
  if (added > 0) {
    const saved = await savePathsToFile(pathLibraryCache);
    console.log(`[PathLib] Batch save result: ${saved ? 'SUCCESS' : 'FAILED'}`);
  }
  
  return added;
};

export const getRandomPath = (rows: number, bucket: number): RecordedPath | null => {
  const paths = pathLibraryCache[String(rows)]?.[String(bucket)];
  
  console.log('[PathLib] getRandomPath for rows:', rows, 'bucket:', bucket, 'found:', paths?.length || 0);
  
  if (!paths || paths.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * paths.length);
  return paths[randomIndex];
};

export const getPathByIndex = (rows: number, bucket: number, index: number): RecordedPath | null => {
  const paths = pathLibraryCache[String(rows)]?.[String(bucket)];
  if (!paths || index < 0 || index >= paths.length) return null;
  return paths[index];
};

export const getAllPathsForBucket = (rows: number, bucket: number): RecordedPath[] => {
  return pathLibraryCache[String(rows)]?.[String(bucket)] || [];
};

export const getLibraryStatus = (rows: number, bucketCount: number): string => {
  const status: string[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const count = getPathCount(rows, i);
    status.push(`B${i}:${count}/${PATHS_PER_BUCKET}`);
  }
  return status.join(' | ');
};

export const getFullLibraryStats = (): { [rows: number]: { buckets: number; totalPaths: number } } => {
  const stats: { [rows: number]: { buckets: number; totalPaths: number } } = {};
  
  for (const rows of [8, 12, 16]) {
    const bucketsData = pathLibraryCache[String(rows)] || {};
    const bucketKeys = Object.keys(bucketsData);
    let totalPaths = 0;
    
    for (const bucket of bucketKeys) {
      totalPaths += bucketsData[bucket]?.length || 0;
    }
    
    stats[rows] = {
      buckets: bucketKeys.length,
      totalPaths,
    };
  }
  
  return stats;
};

export const getBucketNeedingPaths = (rows: number, bucketCount: number): number | null => {
  let minCount = PATHS_PER_BUCKET;
  let needyBucket: number | null = null;
  
  for (let i = 0; i < bucketCount; i++) {
    const count = getPathCount(rows, i);
    if (count < minCount) {
      minCount = count;
      needyBucket = i;
    }
  }
  
  return needyBucket;
};

// Initialize - load from file on startup
console.log('[PathLib] Module loaded - using FILE-BASED storage');
loadLibrary();
