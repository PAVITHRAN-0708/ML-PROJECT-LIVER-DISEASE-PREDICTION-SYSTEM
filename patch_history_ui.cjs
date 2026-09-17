const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedHistoryTable = `                        <tr key={h.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                          <td style={{ padding: '12px 8px', color: 'var(--ink-3)' }}>{history.length - i}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 500 }}>{h.name || '-'}</td>
                          <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{h.sex}</td>
                          <td style={{ padding: '12px 8px' }}>{(h.resultP * 100).toFixed(1)}%</td>
                          <td style={{ padding: '12px 8px', display: 'flex', gap: '12px' }}>
                            <button className="linklike" onClick={() => toggleSaved(h.id)}>
                              {h.saved ? "Unsave" : "Save"}
                            </button>
                            <button className="linklike" onClick={() => deleteHistory(h.id)} style={{ color: '#c53030' }}>
                              Delete
                            </button>
                          </td>
                        </tr>`;

code = code.replace(/<tr key=\{h.id\} style=\{\{ borderBottom: '1px solid var\(--line-soft\)' \}\}>[\s\S]*?<\/tr>/g, updatedHistoryTable);

// Ensure toggleSave is renamed to toggleSaved if necessary. In original code it was toggleSave, but in my patch I used toggleSaved!
// Let's replace toggleSave(h.id) with toggleSaved(h.id) globally if any remained.
code = code.replace(/toggleSave\(/g, "toggleSaved(");

fs.writeFileSync('src/App.tsx', code);
