import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const dataPath = path.join(process.cwd(), 'src/lessons_data.json');
const quizDir = path.join(process.cwd(), 'lesson quiz');

// Helper to recursively find a file
function findFile(dir, matchStr) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findFile(fullPath, matchStr);
      if (found) return found;
    } else {
      if (file.toLowerCase().includes(matchStr.toLowerCase()) && file.endsWith('.docx')) {
        return fullPath;
      }
    }
  }
  return null;
}

async function parseDocxQuiz(filePath) {
  try {
    const result = await mammoth.convertToHtml({path: filePath});
    const html = result.value;
    
    const parts = html.split('</p>');
    const questions = [];
    let currentQuestion = null;
    
    for (let part of parts) {
      let text = part.replace(/<(?!\/?strong>)[^>]+>/g, '').trim();
      if (!text) continue;
      
      if (/^\d+\./.test(text.replace(/<strong>|<\/strong>/g, '').trim())) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: text.replace(/<strong>|<\/strong>/g, '').replace(/^\d+\.\s*/, '').trim(),
          options: {},
          correctOption: 'A'
        };
      } 
      else if (/^[A-D]\)/.test(text.replace(/<strong>|<\/strong>/g, '').trim())) {
        if (currentQuestion) {
          const rawText = text.trim();
          const letterMatch = rawText.match(/^[<strong\s]*>?[A-D]\)/);
          let letter = letterMatch ? rawText.replace(/<[^>]+>/g, '').match(/^[A-D]\)/)[0][0] : rawText.replace(/<[^>]+>/g, '').trim()[0];

          const optionText = text.replace(/<[^>]+>/g, '').replace(/^[A-D]\)\s*/, '').trim();
          currentQuestion.options[letter] = optionText;
          
          if (text.includes('<strong>') || text.includes('<b>')) {
            currentQuestion.correctOption = letter;
          }
        }
      }
    }
    if (currentQuestion) questions.push(currentQuestion);
    
    return questions;
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err);
    return null;
  }
}

async function run() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  for (let lesson of data) {
    const lessonNum = lesson.topic.replace('Lesson ', '').trim();
    // Some folders might be named "Lesson 10" or "Lesson10"
    let lessonFolder = path.join(quizDir, `Lesson ${lessonNum}`);
    if (!fs.existsSync(lessonFolder)) {
       lessonFolder = path.join(quizDir, `Lesson${lessonNum}`);
    }
    if (!fs.existsSync(lessonFolder)) continue;
    
    for (let part of lesson.parts) {
      if (part.quiz) {
        const docxPath = findFile(lessonFolder, `${part.section} MCQ`);
        if (docxPath) {
          const qs = await parseDocxQuiz(docxPath);
          if (qs && qs.length > 0) {
            part.quiz.questions = qs;
            console.log(`Updated ${lesson.topic} - Section ${part.section}`);
          }
        } else {
          console.log(`File not found for ${lesson.topic} - Section ${part.section}`);
        }
      }
    }
    
    if (lesson.finalQuiz) {
      const docxPath = findFile(lessonFolder, `final MCQ`);
      if (docxPath) {
        const qs = await parseDocxQuiz(docxPath);
        if (qs && qs.length > 0) {
          lesson.finalQuiz.questions = qs;
          console.log(`Updated ${lesson.topic} - Final Quiz`);
        }
      } else {
        console.log(`Final Quiz File not found for ${lesson.topic}`);
      }
    }
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Finished updating lessons_data.json!');
}

run();
