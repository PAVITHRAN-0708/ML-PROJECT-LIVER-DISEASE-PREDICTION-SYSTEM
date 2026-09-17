const fs = require('fs');

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

hmCode = hmCode.replace(
  /fields: \['routes\.polyline\.encodedPath'\]/,
  "fields: ['routes.polyline.encodedPolyline']"
);

hmCode = hmCode.replace(
  /const path = response\.routes\[0\]\.polyline\.encodedPath;/,
  "const path = response.routes[0].polyline.encodedPolyline;"
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
