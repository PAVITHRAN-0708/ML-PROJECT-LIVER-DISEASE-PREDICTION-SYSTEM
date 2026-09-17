const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newPredict = `async function predict(panel: Panel): Promise<Result> {
  let logit = -1.95;
  const drivers: Driver[] = [];
  (Object.keys(WEIGHT) as Key[]).forEach(k => {
    const c = CFG[k], m = WEIGHT[k], v = panel[k];
    const dev = m.dir === "high"
      ? Math.max(0, (v - c.hi) / m.div)
      : Math.max(0, (c.lo - v) / m.div);
    const contrib = Math.min(dev, 3) * m.w;
    logit += contrib;
    if (contrib > 0.02) {
      drivers.push({ key: k, label: c.label, contrib, value: v, unit: c.unit.split(" · ").pop() ?? "", dec: c.dec, dir: m.dir });
    }
  });
  drivers.sort((a, b) => b.contrib - a.contrib);
  const topDrivers = drivers.slice(0, 4);
  try {
    const r = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: panel.age,
        gender: panel.sex === 'male' ? 'Male' : 'Female',
        total_bilirubin: panel.tb,
        direct_bilirubin: panel.db,
        alkaline_phosphatase: panel.alp,
        alamine_aminotransferase: panel.alt,
        aspartate_aminotransferase: panel.ast,
        total_proteins: panel.tp,
        albumin: panel.alb,
        albumin_and_globulin_ratio: panel.ag
      }),
    });
    const data = await r.json();
    if (data.probability !== undefined) {
      const p = clamp(data.probability / 100, 0.02, 0.97);
      return { 
        p, 
        drivers: topDrivers, 
        diagnosis: data.diagnosis, 
        reasoning: data.reasoning, 
        nextSteps: data.next_steps 
      };
    }
  } catch (err) {
    console.error("API error, falling back to local model", err);
  }
  // Local fallback
  logit += Math.max(0, (panel.age - 40) / 30) * 0.45;
  if (panel.sex === "male") logit += 0.18;
  const p = clamp(1 / (1 + Math.exp(-logit)), 0.02, 0.97);
  return { p, drivers: topDrivers, diagnosis: "Diagnosis unavailable (local fallback).", reasoning: "Could not reach ML server.", nextSteps: [] };
}`;

code = code.replace(/async function predict\(panel: Panel\): Promise<Result> \{[\s\S]*?return \{ p, drivers: topDrivers \};\n\}/, newPredict);
fs.writeFileSync('src/App.tsx', code);
