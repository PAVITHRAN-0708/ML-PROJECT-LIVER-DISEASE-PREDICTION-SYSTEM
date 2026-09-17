const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove it from app view
const appViewMapCode = `<div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', color: '#1a1d20', marginBottom: '8px' }}>Nearby Medical Test Centers</h3>
              <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '16px' }}>Find the nearest clinics and hospitals to get a liver function panel test.</p>
              <HospitalMap />
            </div>`;
code = code.replace(appViewMapCode, '');

// 2. Add header navigation button
const headerNavCode = `<button className="btn" onClick={() => setView('saved')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Saved
                </button>`;
const newHeaderNavCode = `<button className="btn" onClick={() => setView('saved')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Saved
                </button>
                <button className="btn" onClick={() => setView('map')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Locate Centers
                </button>`;
code = code.replace(headerNavCode, newHeaderNavCode);

// 3. Add view === 'map' section at the end of <main>
const mapSection = `          {view === 'map' && (
            <section className="panel" style={{ gridColumn: '1 / -1', height: 'calc(100vh - 120px)' }}>
              <div className="panel-head" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                <div>
                  <h2>Nearby Medical Centers</h2>
                  <p className="sub">Find clinics and hospitals to get a liver function panel test.</p>
                </div>
                <button className="btn" onClick={() => setView('app')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to Analyzer
                </button>
              </div>
              <div style={{ padding: '0 24px 24px', height: '100%' }}>
                <HospitalMap />
              </div>
            </section>
          )}
        </main>`;
code = code.replace('</main>', mapSection);

// 4. Update the unauthenticated user case to also see the map button
const signInBtnCode = `<button className="btn" onClick={signIn} style={{ background: '#005f56', color: '#fff', borderColor: '#004a43' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                </svg>
                Sign in with Google
              </button>`;
const newSignInBtnCode = `<button className="btn" onClick={() => setView('map')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Locate Centers
                </button>\n` + signInBtnCode;

if (!code.includes("Locate Centers") || code.indexOf("Locate Centers") === code.lastIndexOf("Locate Centers")) {
    code = code.replace(signInBtnCode, newSignInBtnCode);
}


fs.writeFileSync('src/App.tsx', code);
