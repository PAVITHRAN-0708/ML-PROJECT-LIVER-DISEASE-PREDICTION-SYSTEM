const fs = require('fs');

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  /const set = \(k: keyof Panel, v: string\) =>\n\s*setPanel\(p => \(\{ \.\.\.p, \[k\]: k === "sex" \? \(v as Panel\["sex"\]\) : k === "name" \? v : \(v === "" \? "" : Number\(v\)\) \}\)\);/,
  `const set = (k: keyof Panel, v: string) =>
    setPanel(p => ({ ...p, [k]: k === "sex" ? (v as Panel["sex"]) : k === "name" ? v : (v === "" ? "" : Number(v)) }));`
); // already fine

// Need to fix predict() skipping empty strings
const predictSearch = `  (Object.keys(WEIGHT) as Key[]).forEach(k => {
    const c = CFG[k], m = WEIGHT[k], v = panel[k];`;
const predictRepl = `  (Object.keys(WEIGHT) as Key[]).forEach(k => {
    const c = CFG[k], m = WEIGHT[k], v = panel[k];
    if (v === "" || v === undefined) return;`;
appCode = appCode.replace(predictSearch, predictRepl);

fs.writeFileSync('src/App.tsx', appCode);

// Fix HospitalMap.tsx
let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');
const routeSearch = `        const request = {
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        };`;
const routeRepl = `        const request = {
          fields: ['routes.polyline.encodedPath'],
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        };`;
hmCode = hmCode.replace(routeSearch, routeRepl);
fs.writeFileSync('src/HospitalMap.tsx', hmCode);
