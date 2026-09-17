const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /setHistory\(prev => \[\{\n\s*id: Date\.now\(\)\.toString\(\) \+ Math\.random\(\)\.toString\(\),\n\s*timestamp: Date\.now\(\),\n\s*name: currentPanel\.name \|\| "Unknown",\n\s*sex: currentPanel\.sex,\n\s*resultP: res\.p,\n\s*panel: currentPanel,\n\s*saved: false\n\s*\}, \.\.\.prev\]\);/,
  `const newEntry = {
        id: Date.now().toString() + Math.random().toString().slice(2, 10),
        timestamp: Date.now(),
        name: currentPanel.name || "Unknown",
        sex: currentPanel.sex,
        resultP: res.p,
        panel: currentPanel,
        saved: false
      };
      if (user) {
        setDoc(doc(db, \`users/\${user.uid}/history\`, newEntry.id), newEntry).catch(e => console.error("Failed to save history", e));
      } else {
        setHistory(prev => [newEntry, ...prev]);
      }`
);

fs.writeFileSync('src/App.tsx', code);
