const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const updatedExtractEndpoints = code
  .replace(/res\.status\(500\)\.json\(\{ error: error\.message \|\| 'Failed to extract data' \}\);/g, "res.status(500).json({ error: 'Failed to extract data' });")
  .replace(/res\.status\(500\)\.json\(\{ error: error\.message \|\| 'Failed to extract data from audio' \}\);/g, "res.status(500).json({ error: 'Failed to extract data from audio' });")
  .replace(/res\.status\(500\)\.json\(\{ error: error\.message \|\| 'Failed to extract data from text' \}\);/g, "res.status(500).json({ error: 'Failed to extract data from text' });");

fs.writeFileSync('server.ts', updatedExtractEndpoints);
