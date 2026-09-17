const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      let newPanel: Panel = panel;
      setPanel(prev => {
        newPanel = {
          ...prev,
          age: data.age ?? prev.age,
          sex: data.gender ? data.gender.toLowerCase() as "male" | "female" : prev.sex,
          tb: data.total_bilirubin ?? prev.tb,
          db: data.direct_bilirubin ?? prev.db,
          alp: data.alkaline_phosphatase ?? prev.alp,
          alt: data.alamine_aminotransferase ?? prev.alt,
          ast: data.aspartate_aminotransferase ?? prev.ast,
          tp: data.total_proteins ?? prev.tp,
          alb: data.albumin ?? prev.alb,
          ag: data.albumin_and_globulin_ratio ?? prev.ag,
        };
        return newPanel;
      });
      
      run(newPanel);`;

const replacementStr = `      const newPanel = {
        ...panel,
        age: data.age ?? panel.age,
        sex: data.gender ? data.gender.toLowerCase() as "male" | "female" : panel.sex,
        tb: data.total_bilirubin ?? panel.tb,
        db: data.direct_bilirubin ?? panel.db,
        alp: data.alkaline_phosphatase ?? panel.alp,
        alt: data.alamine_aminotransferase ?? panel.alt,
        ast: data.aspartate_aminotransferase ?? panel.ast,
        tp: data.total_proteins ?? panel.tp,
        alb: data.albumin ?? panel.alb,
        ag: data.albumin_and_globulin_ratio ?? panel.ag,
      };
      
      setPanel(newPanel);
      run(newPanel);`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', code);
