const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replaceStr = `  const toggleSaved = async (id: string) => {
    const item = history.find(h => h.id === id);
    if (!item) return;
    if (user) {
      await updateDoc(doc(db, \`users/\${user.uid}/history\`, id), { saved: !item.saved }).catch(console.error);
    } else {
      setHistory(prev => prev.map(h => h.id === id ? { ...h, saved: !h.saved } : h));
    }
  };

  const deleteHistory = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, \`users/\${user.uid}/history\`, id)).catch(console.error);
    } else {
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };`;

code = code.replace(/const toggleSave = \(id: string\) => \{\n\s*setHistory\(prev => prev\.map\(h => h\.id === id \? \{ \.\.\.h, saved: !h\.saved \} : h\)\);\n\s*\};/, replaceStr);

fs.writeFileSync('src/App.tsx', code);
