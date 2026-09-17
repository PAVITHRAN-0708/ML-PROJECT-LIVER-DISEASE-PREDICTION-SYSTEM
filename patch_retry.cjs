const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRetryFunc = `async function generateContentWithRetry(config: any, maxRetries = 4) {
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
        console.log(\`[Retry \${i + 1}/\${maxRetries}] Retrying request with \${currentModel} in \${delay}ms...\`);
        
        if (i === 0) {
            currentModel = "gemini-2.0-flash"; 
            console.log(\`Switching fallback model to \${currentModel}\`);
        } else if (i === 1) {
            currentModel = "gemini-1.5-flash";
            console.log(\`Switching fallback model to \${currentModel}\`);
        } else if (i === 2) {
            currentModel = "gemini-1.5-pro";
            console.log(\`Switching fallback model to \${currentModel}\`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; 
      } else {
        throw err;
      }
    }
  }
}`;

code = code.replace(/async function generateContentWithRetry[\s\S]*?\}\n\}/, newRetryFunc);
fs.writeFileSync('server.ts', code);
