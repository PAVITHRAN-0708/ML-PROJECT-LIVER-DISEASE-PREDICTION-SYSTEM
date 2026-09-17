const fs = require('fs');
let data = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
if (!data.requestFramePermissions.includes('geolocation')) {
    data.requestFramePermissions.push('geolocation');
}
fs.writeFileSync('metadata.json', JSON.stringify(data, null, 2));
