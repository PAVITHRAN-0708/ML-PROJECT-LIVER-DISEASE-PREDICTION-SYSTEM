const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedTools = `<div className="tools">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: '#4a5568' }}>{user.email}</span>
                <button className="btn" onClick={handleSignOut} style={{ background: '#e2e8f0', color: '#4a5568', borderColor: '#cbd5e0' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn" onClick={signIn} style={{ background: '#005f56', color: '#fff', borderColor: '#004a43' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                </svg>
                Sign in with Google
              </button>
            )}
            
            {view === 'app' && user && (
              <>
                <button className="btn" onClick={() => setView('history')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  History
                </button>`;

code = code.replace(/<div className="tools">\n            \{view === 'app' && \(\n              <>\n                <button className="btn" onClick=\{\(\) => setView\('history'\)\}>/, updatedTools);

// ensure delete works in history
const updatedHistoryDel = `                <button className="btn" onClick={() => deleteHistory(h.id)} style={{ color: '#c53030' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>`;
// Right now there's no delete button in history, I should find out if there's one.
fs.writeFileSync('src/App.tsx', code);
