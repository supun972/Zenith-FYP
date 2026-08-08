import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const dataPath = path.join(process.cwd(), 'src/lessons_data.json');
const quizDir = path.join(process.cwd(), 'lesson quiz');

async function parseDocxQuiz(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return null;
    }
    const result = await mammoth.convertToHtml({path: filePath});
    const html = result.value;
    
    // Simple parser
    const parts = html.split('</p>');
    const questions = [];
    let currentQuestion = null;
    
    for (let part of parts) {
      // Clean up tags except <strong>
      let text = part.replace(/<(?!\/?strong>)[^>]+>/g, '').trim();
      if (!text) continue;
      
      // Match question (e.g. "1. ජීවී...")
      if (/^\d+\./.test(text.replace(/<strong>|<\/strong>/g, '').trim())) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: text.replace(/<strong>|<\/strong>/g, '').replace(/^\d+\.\s*/, '').trim(),
          options: {},
          correctOption: 'A'
        };
      } 
      // Match options (e.g. "A) බැක්ටීරියා" or "A) <strong>බැක්ටීරියා</strong>")
      else if (/^[A-D]\)/.test(text.replace(/<strong>|<\/strong>/g, '').trim())) {
        if (currentQuestion) {
          const rawText = text.trim();
          const letterMatch = rawText.match(/^[<strong\s]*>?[A-D]\)/); // Allow <strong> before letter just in case
          let letter = '';
          if (letterMatch) {
             letter = rawText.replace(/<[^>]+>/g, '').match(/^[A-D]\)/)[0][0];
          } else {
             // Fallback
             letter = rawText.replace(/<[^>]+>/g, '').trim()[0];
          }

          const optionText = text.replace(/<[^>]+>/g, '').replace(/^[A-D]\)\s*/, '').trim();
          currentQuestion.options[letter] = optionText;
          
          if (text.includes('<strong>') || text.includes('<b>')) {
            currentQuestion.correctOption = letter;
          }
        }
      }
    }
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err);
    return null;
  }
}

async function run() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  for (let lesson of data) {
    const lessonNum = lesson.topic.replace('Lesson ', ''); // e.g., "1"
    const lessonFolder = path.join(quizDir, `Lesson ${lessonNum}`);
    
    // Update parts
    for (let part of lesson.parts) {
      if (part.quiz) {
        const docxPath = path.join(lessonFolder, `${part.section} MCQ.docx`);
        const qs = await parseDocxQuiz(docxPath);
        if (qs && qs.length > 0) {
          part.quiz.questions = qs;
          console.log(`Updated ${lesson.topic} - Section ${part.section}`);
        }
      }
    }
    
    // Update final quiz
    if (lesson.finalQuiz) {
      // Final quiz file might be named "lesson 1 final MCQ.docx"
      const docxPath = path.join(lessonFolder, `lesson ${lessonNum} final MCQ.docx`);
      const qs = await parseDocxQuiz(docxPath);
      if (qs && qs.length > 0) {
        lesson.finalQuiz.questions = qs;
        console.log(`Updated ${lesson.topic} - Final Quiz`);
      }
    }
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Finished updating lessons_data.json!');
}

run();
