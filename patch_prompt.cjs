const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newPrompt = `const prompt = \`You are an expert medical OCR data extraction model. Carefully read the uploaded medical lab report (image or PDF).
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
\`;`;

code = code.replace(/const prompt = \`You are an expert medical OCR data extraction model[\s\S]*?A\/G Ratio\)\`;/, newPrompt);
fs.writeFileSync('server.ts', code);
