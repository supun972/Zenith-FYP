const cheerio = require('cheerio'); 
const m = require('mammoth'); 
m.convertToHtml({path: 'lesson quiz/Lesson 2/Lesson 02/2.1.docx'}).then(res => { 
  const html = res.value; 
  const $ = cheerio.load(html); 
  const qs = []; 
  let cQ = null; 
  $('p').each((i, el) => { 
    let text = $(el).text().trim(); 
    if(!text) return; 
    
    // Test the exact regex from update_quizzes.js
    const optMatch = text.match(/^([A-Da-d])[\)\.]?\s+(.*)/); 
    const qMatch = text.match(/^(\d+)?[\.\)]?\s*(.*)/); 
    
    if(optMatch){ 
      if(cQ) { 
        cQ.options[optMatch[1].toUpperCase()] = optMatch[2].trim(); 
      } 
    } else { 
      if(text.length > 3 && !text.includes('බහුවරණ') && !text.match(/^lesson/i) && !text.match(/MCQ$/i)) { 
        if(cQ) qs.push(cQ); 
        cQ = {q: text, options: {}}; 
      } 
    } 
  }); 
  if(cQ) qs.push(cQ); 
  console.log(JSON.stringify(qs.filter(q => Object.keys(q.options).length > 0), null, 2)) 
});
