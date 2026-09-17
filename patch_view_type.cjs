const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/useState<'app' \| 'history' \| 'saved'>\('app'\);/, "useState<'app' | 'history' | 'saved' | 'map'>('app');");
fs.writeFileSync('src/App.tsx', code);
