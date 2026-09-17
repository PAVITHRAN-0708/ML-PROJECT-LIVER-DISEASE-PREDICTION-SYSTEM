const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedSignIn = `  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup, ignore safely.
        console.log('Sign in popup closed by user.');
      } else {
        console.error('Sign in error:', err);
      }
    }
  };`;

code = code.replace(/const signIn = async \(\) => \{[\s\S]*?console\.error\(err\);\n    \}\n  \};/, updatedSignIn);

fs.writeFileSync('src/App.tsx', code);
