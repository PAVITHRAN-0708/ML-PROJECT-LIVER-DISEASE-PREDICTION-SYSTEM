const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{view === 'app' && user && \([\s\S]*?<\/button>\n              <>\n            \)\}/;

const fixed = `{view === 'app' && user && (
              <>
                <button className="btn" onClick={() => setView('history')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  History
                </button>
                <button className="btn" onClick={() => setView('saved')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Saved
                </button>
              </>
            )}`;

code = code.replace(/\{view === 'app' && user && \([\s\S]*?<\/>\n            \)\}/, fixed);

fs.writeFileSync('src/App.tsx', code);
