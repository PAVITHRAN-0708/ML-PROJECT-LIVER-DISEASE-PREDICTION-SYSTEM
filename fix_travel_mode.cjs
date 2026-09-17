const fs = require('fs');
let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

hmCode = hmCode.replace(
  /travelMode: 'DRIVE'/g,
  "travelMode: 'DRIVING'"
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
