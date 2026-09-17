const fs = require('fs');

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

// 1. Add geometryLib
hmCode = hmCode.replace(
  /const coreLib = useMapsLibrary\('core'\);/,
  "const coreLib = useMapsLibrary('core');\n  const geometryLib = useMapsLibrary('geometry');"
);

// 2. Fix the dependency array and logic inside useEffect
hmCode = hmCode.replace(
  /if \(!routesLib \|\| !coreLib \|\| !map \|\| !userLoc \|\| !selectedHospital\) return;/,
  "if (!routesLib || !geometryLib || !map || !userLoc || !selectedHospital) return;"
);

hmCode = hmCode.replace(
  /const \{ geometry \} = coreLib as any;\s*currentPolyline = new google\.maps\.Polyline\(\{/,
  "const { encoding } = geometryLib as any;\n          \n          currentPolyline = new google.maps.Polyline({\n"
);

hmCode = hmCode.replace(
  /path: geometry\.encoding\.decodePath\(path\),/,
  "path: encoding.decodePath(path),"
);

// 3. Remove the stale routePolyline.setMap(null) check
hmCode = hmCode.replace(
  /if \(routePolyline\) \{\s*routePolyline\.setMap\(null\);\s*\}/,
  ""
);

hmCode = hmCode.replace(
  /\[routesLib, coreLib, map, userLoc, selectedHospital\]\);/,
  "[routesLib, geometryLib, map, userLoc, selectedHospital]);"
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
