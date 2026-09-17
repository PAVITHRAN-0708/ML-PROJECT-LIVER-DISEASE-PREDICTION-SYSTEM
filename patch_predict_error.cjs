const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newPredictEndpoint = `// Endpoint to predict liver disease using Gemini acting as our trained ML model
app.post('/api/predict', async (req, res) => {
  try {
    const data = req.body;
    
    const prompt = \`You are an expert Hepatologist and an advanced diagnostic Machine Learning model trained extensively on global hepatology data.
Analyze the following patient Liver Function Test (LFT) parameters. Compare them against standard medical reference ranges:
- Total Bilirubin: 0.1 to 1.2 mg/dL
- Direct Bilirubin: < 0.3 mg/dL
- Alkaline Phosphatase (ALP): 40 to 129 U/L
- Alanine Aminotransferase (ALT/SGPT): 7 to 55 U/L
- Aspartate Aminotransferase (AST/SGOT): 8 to 48 U/L
- Total Proteins: 6.0 to 8.3 g/dL
- Albumin: 3.5 to 5.0 g/dL
- Albumin/Globulin (A/G) Ratio: ~ 1.2 to 2.2

ADVANCED CLINICAL TRAINING ALGORITHMS & ALGORITHMIC RULES:
1. R-Factor (R-value) Calculation for Liver Injury categorization:
   - R = (ALT / 55) / (ALP / 129)
   - If R > 5: Hepatocellular injury (Likely Viral, Ischemic, or Toxin-induced).
   - If R < 2: Cholestatic injury (Likely Biliary obstruction, Primary Biliary Cholangitis).
   - If 2 < R < 5: Mixed pattern.
2. De Ritis Ratio (AST/ALT Ratio):
   - AST/ALT > 2.0 strongly suggests Alcoholic Liver Disease (especially if AST < 500).
   - AST/ALT < 1.0 (with elevated transaminases in 100s/1000s) strongly suggests Acute Viral Hepatitis or Ischemia.
   - AST/ALT < 1.0 (with mild transaminases < 100) suggests NAFLD/NASH.
3. Synthetic Function:
   - Low Albumin (< 3.5) with reversed A/G ratio (< 1.0) indicates chronic liver disease or cirrhosis.
4. Bilirubin Pattern:
   - High Direct Bilirubin (> 50% of Total) indicates conjugated hyperbilirubinemia (cholestasis/obstruction).
   - High Indirect (Total minus Direct) suggests hemolysis or Gilbert's syndrome.

--- FEW-SHOT TRAINING DATASET (Reference Cases) ---
Case 1 (Alcoholic Hepatitis): AST=250, ALT=110, Bilirubin=5.0 -> AST/ALT > 2. Diagnosis: Alcoholic Hepatitis Suspected.
Case 2 (Acute Viral Hepatitis): AST=1200, ALT=1500, Bilirubin=3.5 -> AST/ALT < 1, R > 5. Diagnosis: Acute Hepatocellular Injury (Viral).
Case 3 (Biliary Obstruction/Cholestasis): ALP=450, ALT=80, Bilirubin=8.0 (Direct=6.5) -> R < 2, High Direct Bili. Diagnosis: Cholestatic Injury / Biliary Obstruction.
Case 4 (Cirrhosis): Albumin=2.8, TP=7.0, A/G=0.6, Mildly elevated AST/ALT -> Low synthetic function, reversed A/G. Diagnosis: Chronic Liver Disease / Cirrhosis.
Case 5 (Normal): AST=25, ALT=30, ALP=75, Bilirubin=0.8, Albumin=4.2 -> Diagnosis: Normal LFT Profile.

Return a precise JSON object with:
- probability: a number between 0 and 100 representing the likelihood percentage of liver disease or dysfunction.
- risk_level: "Low", "Moderate", or "High"
- diagnosis: A clear, concise clinical impression based directly on the algorithmic rules and reference cases.
- reasoning: Detailed medical reasoning explaining the analysis, explicitly citing the calculated R-factor or AST/ALT ratios if abnormal, and correlating specific markers.
- next_steps: An array of 3-4 actionable recommendations (e.g., Ultrasound abdomen, Hepatitis serology, Ethanol abstention, Consult Hepatologist).
- feature_importance: An array of the top 3 contributing test results and their clinical implication.

Patient Data to Analyze:
\${JSON.stringify(data, null, 2)}
\`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      systemInstruction: "You are an elite diagnostic ML model acting as an expert hepatologist. You have been trained on thousands of liver function test reports and advanced hepatology heuristics (De Ritis ratio, R-Factor, Synthetic Function analysis). Evaluate inputs rigorously. Map the inputs against the provided training reference cases to ensure maximum diagnostic precision. Output strictly valid JSON.",
      contents: prompt,
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            probability: { type: Type.NUMBER, description: "Percentage from 0 to 100" },
            risk_level: { type: Type.STRING, description: "Low, Moderate, or High" },
            diagnosis: { type: Type.STRING, description: "Clinical impression conclusion" },
            reasoning: { type: Type.STRING },
            next_steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable medical/lifestyle recommendations"
            },
            feature_importance: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["probability", "risk_level", "diagnosis", "reasoning", "next_steps", "feature_importance"]
        }
      }
    });

    const text = response.text || "{}";
    const predictionResult = JSON.parse(text);
    res.json(predictionResult);
  } catch (error: any) {
    console.log('[Prediction ML Error] Models exhausted or unavailable. Falling back to frontend heuristic.');
    // Return a 200 with an empty object or specific flag so the frontend can fallback
    res.json({ _fallback: true });
  }
});`;

code = code.replace(/\/\/ Endpoint to predict liver disease using Gemini acting as our trained ML model[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \|\| 'Failed to perform prediction' \}\);\n  \}\n\}\);/, newPredictEndpoint);
fs.writeFileSync('server.ts', code);
