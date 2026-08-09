const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/lessons_data.json', 'utf8'));

const correctAnswers = {
  // 2.1
  "මිනිස් ඇසේ ආලෝකය ඇතුල් වන කොටස": "B",
  "ඇසේ වර්ණවත් කොටස": "A",
  "දෘශ්‍ය පණිවිඩ මොළයට": "B",
  "පියුපිල් ප්‍රමාණය පාලනය": "C",
  "ආලෝකය රූපයක් බවට පත්වන": "B",
  // 2.2
  "ඇසට ඇතුල් වන ආලෝක ප්‍රමාණය පාලනය වන්නේ": "B",
  "අඳුරේදී පියුපිල් ප්‍රමාණය": "B",
  "ආලෝකය වැඩි විට පියුපිල් ප්‍රමාණය": "B",
  "ලෙන්සයේ හැඩය වෙනස් වීම": "C",
  "ආසන්න වස්තු බැලීමේදී ලෙන්සය": "C",
  // 2.3
  "කනේ බාහිර කොටස": "B",
  "ශබ්ද තරංග මුලින්ම වැදෙන": "B",
  "මධ්‍ය කනේ අස්ථි": "C",
  "ශබ්ද පණිවිඩ මොළයට": "A",
  "කනේ සමතුලිතතාව පාලනය කරන": "B",
  // 2.4
  "කනේ සමතුලිතතාව පවත්වා ගැනීමට උපකාරී": "B",
  "යාන්ත්‍රික කම්පන බවට පත්": "A",
  "කනේ අභ්‍යන්තර කොටසට අයත් නොවන": "C",
  "කනේ අස්ථි වල ප්‍රධාන කාර්යය": "B",
  "කනේ තරලයෙන් පිරුණු": "A",
  // 2.5
  "ඇස් ආරක්ෂා කර ගැනීමට වැදගත්": "B",
  "කනට හානි වීමට හේතු විය": "B",
  "ඇස් පරීක්ෂා කිරීම වැදගත්": "A",
  "කන පිරිසිදු කිරීමේදී භාවිතා නොකළ යුතු": "B",
  "දීර්ඝ කාලයක් අධික ශබ්දයට": "B",
  
  // Lesson 2 Final specific
  "මිනිස් ඇසේ ආලෝකය පාලනය කරන්නේ": "B",
  "ඇසේ රූපයක් සෑදෙන ස්ථානය": "B",
  "කනේ ශබ්ද තරංග යාන්ත්‍රික කම්පන": "B",

  // 8.1
  "ශාක ආහාර නිෂ්පාදනය සඳහා භාවිතා කරන ක්‍රියාවලිය": "B",
  "ප්‍රභාසංස්ලේෂණය සඳහා අත්‍යවශ්‍ය වායුව": "C",
  "ශාක වල ආහාර ගබඩා කරන ප්‍රධාන ස්ථානයක්": "A",
  "ශාකවලට ජලය ලබා ගන්නේ": "B",
  "හරිතප්‍රද පිහිටා ඇත්තේ": "A",
  // 8.2
  "ප්‍රභාසංස්ලේෂණයේ ප්‍රධාන ඵලය": "A",
  "ප්‍රභාසංස්ලේෂණයේදී නිදහස් වන වායුව": "B",
  "ප්‍රභාසංස්ලේෂණය සිදුවන්නේ කුමන වේලාවේදීද": "A",
  "ශාක ග්ලූකෝස් ගබඩා කරන්නේ කුමක් ලෙසද": "B",
  "ප්‍රභාසංස්ලේෂණයට අවශ්‍ය නොවන දෙයක්": "B",
  // 8.3
  "වායුගෝලයට ඔක්සිජන් එක් කිරීම වැදගත් වන්නේ": "B",
  "ශාක ආහාර නිපදවීම නැවැත්වුවහොත්": "C",
  "ප්‍රභාසංස්ලේෂණය මඟින් පාලනය වන වායුව": "A",
  "පෘථිවියේ ජීවය පවත්වා ගැනීමට ප්‍රභාසංස්ලේෂණය": "A",
  "හරිතාගාර ආචරණය අඩු කිරීමට ශාක": "A",
  
  // Lesson 8 Final specific (most overlap with above)
  "ශාක ආහාර ගබඩා කරන්නේ": "B",

  // 9.1
  "Evolution යනු": "A",
  "පරිණාමය යනු කුමක්ද": "A",
  "පරිණාමවාදය ඉදිරිපත් කළ": "B",
  "පරිණාමය පිළිබඳ ප්‍රසිද්ධ": "C",
  "ස්වභාවික තේරීම (Natural selection)": "B",
  "Natural selection යන්නෙන් අදහස්": "B",
  "පරිසරයට හොඳින් ගැළපෙන": "B",
  "Adaptation යනු කුමක්ද": "A",
  // 9.2
  "Fossils යනු": "A",
  "Fossils පරිණාමයට සාක්ෂි": "A",
  "Homologous organs සඳහා": "B", // Wait, in my analysis: "මිනිස් අත සහ වවුලාගේ පියාපත්" is A in 9.2, but B in Final? Let me check string
  "Vestigial organs යනු": "B",
  "මිනිසාගේ appendix එක": "B",
  // 9.3
  "Variation යන්නෙන් අදහස්": "A",
  "Genetic variation ඇතිවීමට හේතුවක්": "B",
  "Genetic variation ඇතිවීමට ප්‍රධාන හේතුවක්": "A",
  "Variation ජීවීන්ට වැදගත්": "A",
  "Mutation යනු": "A",
  "පරිසරය variation වලට": "C",
  // 9.4
  "Artificial selection යනු": "B",
  "ගොවිපළ සතුන් තෝරා බෝ කිරීම": "B",
  "Biodiversity යන්නෙන්": "A",
  "පරිසර විනාශය biodiversity": "B",
  "ජීවී විවිධත්වය සංරක්ෂණය": "A",

  // 10.1
  "විද්‍යුත් විච්ඡේදනය යනු කුමක්ද": "B",
  "විද්‍යුත් විච්ඡේදනය සඳහා අවශ්‍ය ප්‍රධාන": "B",
  "Electrolyte යනු": "B",
  "Cathode යනු": "B",
  "Anode යනු": "B",
  "විද්‍යුත් විච්ඡේදනය සිදුවීමට electrolyte": "B",
  "Electrodes සාමාන්‍යයෙන් සාදා ඇත්තේ": "C",
  // 10.2
  "Cation යනු": "B",
  "Anion යනු": "B",
  "Cation ගමන් කරන්නේ": "A",
  "Anion ගමන් කරන්නේ": "B",
  "ජලයේ විද්‍යුත් විච්ඡේදනයේදී නිපදවන වායු 2": "A",
  "Cathode වෙත ගමන් කරන අයන වර්ගය": "C",
  "Anode වෙත ගමන් කරන අයන වර්ගය": "B",
  "විද්‍යුත් විච්ඡේදනයේදී රසායනික වෙනසක්": "A",
  "Copper sulphate ද්‍රාවණය": "A",
  "විද්‍යුත් විච්ඡේදනයේදී ions චලනය": "B",
  "Molten sodium chloride": "B",
  // 10.3
  "Electroplating යනු": "B",
  "Electroplating සඳහා භාවිතා කරන එක්": "A",
  "Electroplating කිරීමේ ප්‍රධාන වාසියක්": "B",
  "බැටරි charging කිරීම සම්බන්ධ": "A",
  "විද්‍යුත් විච්ඡේදනය භාවිතා කරන කර්මාන්තයක්": "A",
  "Electrolysis භාවිතා කර ලෝහ පිරිසිදු කිරීම": "C",
  "Electrolysis ක්‍රියාවලියේදී positive electrode": "B",
  "Dilute sulfuric acid ජලයට": "B",
  "Electroplating සඳහා ආලේප කළ යුතු": "B",
  "විද්‍යුත් විච්ඡේදනය භාවිතයෙන් නිපදවන වායුවක්": "A",
  "Electrolysis කර්මාන්තවල වැදගත් වන්නේ": "A",
  "Electrolysis සිදුවන විට electrolyte එක තුළ": "B"
};

let updated = 0;

data.forEach(s => {
  if (['Lesson 2', 'Lesson 8', 'Lesson 9', 'Lesson10'].includes(s.topic)) {
    
    // Fix sections
    s.parts.forEach(p => {
      if (p.quiz && p.quiz.questions) {
        p.quiz.questions.forEach(q => {
           for (const key of Object.keys(correctAnswers)) {
             if (q.question.includes(key)) {
                
                // Special edge cases where options are swapped between section and final
                if (key === "Homologous organs සඳහා") {
                   if (q.options["A"] === "මිනිස් අත සහ වවුලාගේ පියාපත්") q.correctOption = "A";
                   else if (q.options["B"] === "මිනිස් අත සහ වවුලාගේ පියාපත්") q.correctOption = "B";
                }
                else if (key === "ප්‍රභාසංස්ලේෂණය සඳහා අත්‍යවශ්‍ය වායුව") {
                   if (q.options["C"] === "කාබන් ඩයොක්සයිඩ්") q.correctOption = "C";
                   else q.correctOption = "B";
                }
                else {
                   q.correctOption = correctAnswers[key];
                }
                updated++;
                break;
             }
           }
        });
      }
    });

    // Fix final quiz
    if (s.finalQuiz && s.finalQuiz.questions) {
      s.finalQuiz.questions.forEach(q => {
         for (const key of Object.keys(correctAnswers)) {
             if (q.question.includes(key)) {
                if (key === "Homologous organs සඳහා") {
                   if (q.options["A"] === "මිනිස් අත සහ වවුලාගේ පියාපත්") q.correctOption = "A";
                   else if (q.options["B"] === "මිනිස් අත සහ වවුලාගේ පියාපත්") q.correctOption = "B";
                }
                else if (key === "ප්‍රභාසංස්ලේෂණය සඳහා අත්‍යවශ්‍ය වායුව") {
                   if (q.options["C"] === "කාබන් ඩයොක්සයිඩ්") q.correctOption = "C";
                   else q.correctOption = "B";
                }
                else {
                   q.correctOption = correctAnswers[key];
                }
                updated++;
                break;
             }
           }
      });
    }

  }
});

fs.writeFileSync('src/lessons_data.json', JSON.stringify(data, null, 2));
console.log('Successfully updated', updated, 'answers based on AI predictions!');
