const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const deleteFunc = `const deleteHistory = async (id: string) => {
    if (!user) return;
    const path = \`users/\${user.uid}/history\`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };
  
  const toggleSaved = async`;

code = code.replace(/const toggleSaved = async/, deleteFunc);
fs.writeFileSync('src/App.tsx', code);
