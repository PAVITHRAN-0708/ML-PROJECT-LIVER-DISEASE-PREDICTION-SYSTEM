const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newHistoryEntry = `type HistoryEntry = {
  id: string;
  userId: string;
  timestamp: number;
  name: string;
  sex: string;
  resultP: number;
  panel: Panel;
  saved: boolean;
  diagnosis?: string | null;
  reasoning?: string | null;
};`;

code = code.replace(/type HistoryEntry = \{[\s\S]*?saved: boolean;\n\};/, newHistoryEntry);

fs.writeFileSync('src/App.tsx', code);
