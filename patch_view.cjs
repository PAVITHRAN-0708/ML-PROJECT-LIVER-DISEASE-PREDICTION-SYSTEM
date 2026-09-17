const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const \[authChecking, setAuthChecking\] = useState\(true\);/,
  "const [authChecking, setAuthChecking] = useState(true);\n  const [view, setView] = useState<'app' | 'history' | 'saved'>('app');"
);

fs.writeFileSync('src/App.tsx', code);
