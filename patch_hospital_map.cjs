const fs = require('fs');

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

hmCode = hmCode.replace(
  /fields: \['routes\.polyline\.encodedPolyline'\]/,
  "fields: ['routes.path']"
);

hmCode = hmCode.replace(
  /const path = response\.routes\[0\]\.polyline\.encodedPolyline;\s*const { geometry } = coreLib as any;\s*currentPolyline = new google\.maps\.Polyline\(\{[\s\S]*?path: geometry\.encoding\.decodePath\(path\),/m,
  "const path = response.routes[0].path;\n          \n          currentPolyline = new google.maps.Polyline({\n            path: path,"
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
