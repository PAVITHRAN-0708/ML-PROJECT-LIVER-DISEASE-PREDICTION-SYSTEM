const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              <button className="btn" onClick={() => setView('map')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Locate Centers
                </button>
<button className="btn" onClick={signIn} style={{ background: '#005f56', color: '#fff', borderColor: '#004a43' }}>`;

const newStr = `              <>
              <button className="btn" onClick={() => setView('map')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Locate Centers
                </button>
<button className="btn" onClick={signIn} style={{ background: '#005f56', color: '#fff', borderColor: '#004a43' }}>`;

code = code.replace(targetStr, newStr);
code = code.replace(`                Sign in with Google
              </button>
            )}`, `                Sign in with Google
              </button>
              </>
            )}`);

fs.writeFileSync('src/App.tsx', code);
