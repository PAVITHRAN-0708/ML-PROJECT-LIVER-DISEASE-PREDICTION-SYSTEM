const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRetryFunc = `async function generateContentWithRetry(config: any, maxRetries = 5) {
  let delay = 1500;
  let currentModel = config.model;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create a fresh config object with the potentially updated model
      const attemptConfig = { ...config, model: currentModel };
      return await ai.models.generateContent(attemptConfig);
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      const isRetryable = 
        error.status === 503 || 
        error.status === 429 || 
        (error.message && (error.message.includes('503') || error.message.includes('429') || error.message.includes('UNAVAILABLE') || error.message.includes('high demand') || error.message.includes('RESOURCE_EXHAUSTED')));
        
      if (isRetryable) {
        console.warn(\`[Retry \${i + 1}/\${maxRetries}] Gemini API overloaded/rate-limited on \${currentModel}. Retrying in \${delay}ms...\`);
        
        // If we're failing heavily on one model (e.g. 503 high demand or 429 quota), try gracefully falling back
        if (i === 1) {
             currentModel = "gemini-2.5-flash"; // First fallback
             console.warn(\`Switching fallback model to \${currentModel}\`);
        } else if (i === 3) {
             currentModel = "gemini-1.5-flash"; // Second fallback
             console.warn(\`Switching fallback model to \${currentModel}\`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // exponential backoff
      } else {
        throw error;
      }
    }
  }
}`;

code = code.replace(/async function generateContentWithRetry[\s\S]*?\}\n\}/, newRetryFunc);
fs.writeFileSync('server.ts', code);
