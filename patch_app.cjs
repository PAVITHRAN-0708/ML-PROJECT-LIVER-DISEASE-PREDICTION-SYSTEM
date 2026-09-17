const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Adding imports
const imports = `import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, setDoc, query, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';`;

code = code.replace(/import React, { useEffect, useMemo, useRef, useState } from "react";\nimport { toPng } from 'html-to-image';\nimport { jsPDF } from 'jspdf';/, imports);

// We need to add a User state and load history from Firebase.
const appComponentStart = `export default function App() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecking(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const path = \`users/\${user.uid}/history\`;
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: HistoryEntry[] = [];
      snapshot.forEach(doc => {
        data.push(doc.data() as HistoryEntry);
      });
      data.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    
    return unsubscribe;
  }, [user]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };
`;

code = code.replace(/export default function App\(\) \{[\s\S]*?const \[history, setHistory\] = useState<HistoryEntry\[\]>\(\[\]\);/, appComponentStart);

// Intercept `saveHistory` to save to Firebase
const saveHistoryFunc = `const saveHistory = async (saveState: boolean) => {
    if (!result || !user) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      userId: user.uid,
      timestamp: Date.now(),
      name: panel.sex === 'male' ? "Male" : "Female",
      sex: panel.sex,
      resultP: result.p,
      panel: panel,
      saved: saveState,
      diagnosis: result.diagnosis || null,
      reasoning: result.reasoning || null
    };
    
    const path = \`users/\${user.uid}/history\`;
    try {
      await setDoc(doc(db, path, entry.id), entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    setNote(saveState ? "Saved to history." : "Analysis completed.");
    setTimeout(() => setNote(IDLE_NOTE), 3000);
  };`;

code = code.replace(/const saveHistory = \(saveState: boolean\) => \{[\s\S]*?setTimeout\(\(\) => setNote\(IDLE_NOTE\), 3000\);\n  \};/, saveHistoryFunc);

// Intercept history toggling saved
const toggleSavedFunc = `const toggleSaved = async (id: string) => {
    if (!user) return;
    const h = history.find(x => x.id === id);
    if (!h) return;
    const path = \`users/\${user.uid}/history\`;
    try {
      await updateDoc(doc(db, path, id), { saved: !h.saved });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };`;

code = code.replace(/const toggleSaved = \(id: string\) => \{[\s\S]*?\}\);/, toggleSavedFunc);

// Remove item from history
const deleteHistoryFunc = `const deleteHistory = async (id: string) => {
    if (!user) return;
    const path = \`users/\${user.uid}/history\`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };`;
  
// I'll add the delete helper and modify HistoryEntry in the code as well.

fs.writeFileSync('src/App.tsx', code);
