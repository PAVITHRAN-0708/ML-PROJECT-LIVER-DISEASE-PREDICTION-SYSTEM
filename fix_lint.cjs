const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  /logit \+= Math\.max\(0, \(panel\.age - 40\) \/ 30\) \* 0\.45;/g,
  "logit += Math.max(0, (Number(panel.age) - 40) / 30) * 0.45;"
);

appCode = appCode.replace(
  /if \(\(panel\.ast \/ Math\.max\(1, panel\.alt\)\) > 2 && panel\.ast > 50\)/g,
  "if ((Number(panel.ast) / Math.max(1, Number(panel.alt))) > 2 && Number(panel.ast) > 50)"
);

appCode = appCode.replace(
  /else if \(panel\.alt > 100\)/g,
  "else if (Number(panel.alt) > 100)"
);

appCode = appCode.replace(
  /else if \(panel\.alp > 150\)/g,
  "else if (Number(panel.alp) > 150)"
);

fs.writeFileSync('src/App.tsx', appCode);

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');
hmCode = hmCode.replace(
  /const request = \{[\s\S]*?routingPreference: 'TRAFFIC_AWARE'[\s\S]*?\};[\s\S]*?request\.fields = \['durationMillis', 'distanceMeters', 'path'\];/m,
  `const request: any = {
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          fields: ['durationMillis', 'distanceMeters', 'path']
        };`
);

// Fix TS2339: Property 'env' does not exist on type 'ImportMeta'
hmCode = hmCode.replace(
  /import\.meta\.env\.VITE_GOOGLE_MAPS_API_KEY/g,
  "(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY"
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
