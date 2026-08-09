const cheerio = require('cheerio');

const html = `<p><strong>1.1 ක්ෂුද්‍ර ජීවීන් (ප්‍රශ්න 5)</strong></p><p>1. ජීවී මෙන්ම අජීවී ලක්ෂණ පෙන්වන, සෛලීය සංවිධානයක් නොමැති ක්ෂුද්‍ර ජීවී කාණ්ඩය කුමක්ද? </p><p>A) බැක්ටීරියා </p><p>B) <strong>වෛරස්</strong> </p><p>C) ඇල්ගී </p><p>D) ප්‍රෝටොසෝවා </p>
<ol><li>මිනිස් ඇසේ ආලෝකය ඇතුල් වන කොටස කුමක්ද?<ul><li>a) රෙටිනා</li><li>b) <strong>කෝර්නියා</strong></li><li>c) නාසය</li><li>d) කන් පටලය</li></ul></li></ol>
`;

  const $ = cheerio.load(html);
  const questions = [];
  let currentQ = null;

  $('p, li').each((i, el) => {
    let clone = $(el).clone();
    // Remove nested lists so they don't get appended to the parent li text
    clone.find('ul, ol').remove();
    let text = clone.text().trim();
    
    if (!text) return;
    
    console.log("Extracted text:", text);

    const optMatch = text.match(/^([A-Da-d])[\)\.]?\s+(.*)/);
    const qMatch = text.match(/^(\d+)?[\.\)]?\s*(.*)/);

    if (optMatch) {
      if (currentQ) {
        const optLetter = optMatch[1].toUpperCase();
        let optText = optMatch[2].trim();
        
        // Sometimes the bold might just be on the letter itself, or on the text.
        // `$(el).find('strong').length > 0` checks if ANY strong exists.
        const hasStrong = $(el).find('strong, b').length > 0;
        if (hasStrong) {
          currentQ.correctOption = optLetter;
        }
        
        if (optText) {
          currentQ.options[optLetter] = optText;
        } else {
           // If somehow optText is still empty, maybe fallback to text without the prefix
           currentQ.options[optLetter] = text.replace(/^([A-Da-d])[\)\.]?\s+/, '').trim();
        }
      }
    } else {
      if (text.length > 3 && !text.includes('බහුවරණ') && !text.match(/^lesson/i) && !text.match(/MCQ$/i) && !text.match(/ප්‍රශ්න \d/i)) {
        if (currentQ) questions.push(currentQ);
        currentQ = {
          question: qMatch[2] ? qMatch[2].trim() : text,
          options: {},
          correctOption: 'A'
        };
      }
    }
  });

  if (currentQ) questions.push(currentQ);
  console.log(JSON.stringify(questions.filter(q => Object.keys(q.options).length > 0), null, 2));
