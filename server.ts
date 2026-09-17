import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to handle transient API overloads
async function generateContentWithRetry(config: any, maxRetries = 3) {
  let delay = 1000;
  let currentModel = config.model;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({ ...config, model: currentModel });
    } catch (err: any) {
      if (i === maxRetries - 1) throw err;
      
      const isRetryable = 
        err.status === 503 || 
        err.status === 429 || 
        err.status === 404 || 
        (err.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('UNAVAILABLE') || err.message.includes('high demand') || err.message.includes('RESOURCE_EXHAUSTED')));
        
      if (isRetryable) {
        console.log(`[Retry ${i + 1}/${maxRetries}] Retrying request with ${currentModel} in ${delay}ms...`);
        
        if (i === 0) {
            currentModel = "gemini-2.0-flash"; 
            console.log(`Switching fallback model to ${currentModel}`);
        } else if (i === 1) {
            currentModel = "gemini-1.5-flash-latest";
            console.log(`Switching fallback model to ${currentModel}`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; 
      } else {
        throw err;
      }
    }
  }
}

app.use(express.json());

// Endpoint to extract liver test parameters from an uploaded document using Gemini ML models
app.post('/api/extract', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');

    const prompt = `You are an expert medical OCR data extraction model. Carefully read the uploaded medical lab report (image or PDF).
Extract the PATIENT'S EXACT VALUES for the following Liver Function Test (LFT) parameters.
IMPORTANT RULES:
- Extract the PATIENT's value, NOT the reference ranges or normal values.
- Convert units to standard if they differ (Bilirubin in mg/dL, Enzymes in U/L, Proteins in g/dL).
- If a parameter is not found or missing from the report, you MUST return -999 for it.

Required parameters:
- age: Number (Patient's age, look for 'Age')
- gender: String ("Male" or "Female")
- total_bilirubin: Number
- direct_bilirubin: Number
- alkaline_phosphatase: Number (ALP)
- alamine_aminotransferase: Number (SGPT / ALT)
- aspartate_aminotransferase: Number (SGOT / AST)
- total_proteins: Number
- albumin: Number
- albumin_and_globulin_ratio: Number (A/G Ratio)

Few-Shot Training Examples for accurate extraction:
Example 1: "Patient Name: John Doe, Age: 45, Sex: Male. Test: Bilirubin Total 1.2 mg/dl, Bilirubin Direct 0.3 mg/dl, SGOT 45 U/L, SGPT 30 U/L"
Output: age: 45, gender: "Male", total_bilirubin: 1.2, direct_bilirubin: 0.3, aspartate_aminotransferase: 45, alamine_aminotransferase: 30, alkaline_phosphatase: -999, ...

Example 2: "Age: 32 Yrs / Female. LFT Profile: ALP 120 IU/L, Total Protein 7.2 g/dL, Albumin 4.1 g/dL, A/G Ratio 1.3"
Output: age: 32, gender: "Female", alkaline_phosphatase: 120, total_proteins: 7.2, albumin: 4.1, albumin_and_globulin_ratio: 1.3, total_bilirubin: -999, ...
`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      systemInstruction: "You are an expert medical data extraction ML model. You extract liver test parameters accurately from clinical documents (images or PDFs), handling various formats and units gracefully. IMPORTANT: If a value is missing, return -999 for numbers, or 'missing' for strings.",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.NUMBER, description: "Patient's age" },
            gender: { type: Type.STRING, description: "'Male' or 'Female' or 'missing'" },
            total_bilirubin: { type: Type.NUMBER },
            direct_bilirubin: { type: Type.NUMBER },
            alkaline_phosphatase: { type: Type.NUMBER },
            alamine_aminotransferase: { type: Type.NUMBER },
            aspartate_aminotransferase: { type: Type.NUMBER },
            total_proteins: { type: Type.NUMBER },
            albumin: { type: Type.NUMBER },
            albumin_and_globulin_ratio: { type: Type.NUMBER },
          }
        }
      }
    });

    const text = response.text || "{}";
    const extractedData = JSON.parse(text);
    
    // Clean up missing values (-999 or 'missing')
    for (const key in extractedData) {
      if (extractedData[key] === -999 || extractedData[key] === 'missing') {
        extractedData[key] = null;
      }
    }
    
    res.json(extractedData);
  } catch (error: any) {
    console.log('Error extracting data:', error);
    res.status(500).json({ error: 'Failed to extract data' });
  }
});

// Endpoint to extract liver test parameters from audio using Gemini ML models
app.post('/api/extract-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');

    const prompt = `You are a medical data extraction ML model. Listen to the audio dictation and extract the following liver function test parameters. If a parameter is not found or missing, you MUST return -999 for it.
Required parameters:
- age: Number (Patient's age)
- gender: String ("Male" or "Female")
- total_bilirubin: Number
- direct_bilirubin: Number
- alkaline_phosphatase: Number
- alamine_aminotransferase: Number (SGPT)
- aspartate_aminotransferase: Number (SGOT)
- total_proteins: Number
- albumin: Number
- albumin_and_globulin_ratio: Number`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      systemInstruction: "You are an expert medical data extraction ML model. You extract liver test parameters accurately from clinical audio dictations. IMPORTANT: If a value is missing, return -999 for numbers, or 'missing' for strings.",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.NUMBER, description: "Patient's age" },
            gender: { type: Type.STRING, description: "'Male' or 'Female' or 'missing'" },
            total_bilirubin: { type: Type.NUMBER },
            direct_bilirubin: { type: Type.NUMBER },
            alkaline_phosphatase: { type: Type.NUMBER },
            alamine_aminotransferase: { type: Type.NUMBER },
            aspartate_aminotransferase: { type: Type.NUMBER },
            total_proteins: { type: Type.NUMBER },
            albumin: { type: Type.NUMBER },
            albumin_and_globulin_ratio: { type: Type.NUMBER },
          }
        }
      }
    });

    const text = response.text || "{}";
    const extractedData = JSON.parse(text);
    
    // Clean up missing values (-999 or 'missing')
    for (const key in extractedData) {
      if (extractedData[key] === -999 || extractedData[key] === 'missing') {
        extractedData[key] = null;
      }
    }
    
    res.json(extractedData);
  } catch (error: any) {
    console.log('Error extracting data from audio:', error);
    res.status(500).json({ error: 'Failed to extract data from audio' });
  }
});

// Endpoint to extract liver test parameters from text (live dictation)
app.post('/api/extract-text', async (req, res) => {
  try {
    const { text: transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const prompt = `You are a medical data extraction ML model. Read the following live dictation transcript and extract the liver function test parameters. If a parameter is not found or missing, you MUST return -999 for it.
Required parameters:
- age: Number (Patient's age)
- gender: String ("Male" or "Female")
- total_bilirubin: Number
- direct_bilirubin: Number
- alkaline_phosphatase: Number
- alamine_aminotransferase: Number (SGPT)
- aspartate_aminotransferase: Number (SGOT)
- total_proteins: Number
- albumin: Number
- albumin_and_globulin_ratio: Number

Transcript:
"${transcript}"`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      systemInstruction: "You are an expert medical data extraction ML model. You extract liver test parameters accurately from clinical dictation transcripts. You update your extraction as more text is provided. IMPORTANT: If a value is missing, return -999 for numbers, or 'missing' for strings.",
      contents: prompt,
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            age: { type: Type.NUMBER, description: "Patient's age" },
            gender: { type: Type.STRING, description: "'Male' or 'Female' or 'missing'" },
            total_bilirubin: { type: Type.NUMBER },
            direct_bilirubin: { type: Type.NUMBER },
            alkaline_phosphatase: { type: Type.NUMBER },
            alamine_aminotransferase: { type: Type.NUMBER },
            aspartate_aminotransferase: { type: Type.NUMBER },
            total_proteins: { type: Type.NUMBER },
            albumin: { type: Type.NUMBER },
            albumin_and_globulin_ratio: { type: Type.NUMBER },
          }
        }
      }
    });

    const text = response.text || "{}";
    const extractedData = JSON.parse(text);
    
    // Clean up missing values (-999 or 'missing')
    for (const key in extractedData) {
      if (extractedData[key] === -999 || extractedData[key] === 'missing') {
        extractedData[key] = null;
      }
    }
    
    res.json(extractedData);
  } catch (error: any) {
    console.log('Error extracting data from text:', error);
    res.status(500).json({ error: 'Failed to extract data from text' });
  }
});

// Endpoint to predict liver disease using Gemini acting as our trained ML model
app.post('/api/predict', async (req, res) => {
  try {
    const data = req.body;
    
    const prompt = `You are an expert Hepatologist and an advanced diagnostic Machine Learning model trained extensively on global hepatology data.
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
${JSON.stringify(data, null, 2)}
`;

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
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
