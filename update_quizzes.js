import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

async function parseMCQHtml(html, title) {
  const $ = cheerio.load(html);
  const questions = [];
  let currentQ = null;

  $('p, li').each((i, el) => {
    let clone = $(el).clone();
    clone.find('ul, ol').remove();
    let text = clone.text().trim();
    
    if (!text && $(el).is('p')) {
        text = $(el).text().trim();
    }
    
    if (!text) {
        text = $(el).text().trim();
    }

    if (!text) return;

    // More robust regex for options: uppercase or lowercase, with or without parenthesis/dot
    const optMatch = text.match(/^([A-Da-d])[\)\.]?\s+(.*)/);
    
    // Check if it's a question: Either starts with a number, or ends with '?'
    const qMatch = text.match(/^(\d+)?[\.\)]?\s*(.*)/);

    if (optMatch) {
      if (currentQ) {
        const optLetter = optMatch[1].toUpperCase();
        let optText = optMatch[2].trim();
        
        const hasStrong = $(el).find('strong, b').length > 0;
        if (hasStrong) {
          currentQ.correctOption = optLetter;
        }
        
        if (optText) {
          currentQ.options[optLetter] = optText;
        } else {
           currentQ.options[optLetter] = text.replace(/^([A-Da-d])[\)\.]?\s+/, '').trim();
        }
      }
    } else {
      // It's not an option, so it must be a question (or title)
      // Ignore titles (e.g. "බහුවරණ ප්‍රශ්න")
      if (text.length > 3 && !text.includes('බහුවරණ') && !text.match(/^lesson/i) && !text.match(/MCQ$/i) && !text.match(/ප්‍රශ්න \d/i)) {
        if (currentQ) questions.push(currentQ);
        currentQ = {
          question: qMatch[2] ? qMatch[2].trim() : text,
          options: {},
          correctOption: 'A' // default
        };
      }
    }
  });

  if (currentQ) questions.push(currentQ);

  // Filter out any invalid questions (e.g. ones without options)
  const validQuestions = questions.filter(q => Object.keys(q.options).length > 0);

  if (validQuestions.length > 0) {
    return {
      title: title,
      questions: validQuestions
    };
  }
  return null;
}

async function run() {
  try {
    const rawData = await fs.readFile('src/lessons_data.json', 'utf8');
    const sessions = JSON.parse(rawData);
    
    let updatedCount = 0;

    for (const session of sessions) {
      const lessonNumberMatch = session.topic.match(/Lesson\s*(\d+)/i);
      if (!lessonNumberMatch) continue;
      
      const lessonNum = lessonNumberMatch[1];
      const lessonDirOptions = [
        path.join('lesson quiz', `Lesson ${lessonNum}`),
        path.join('lesson quiz', `Lesson${lessonNum}`),
        path.join('lesson quiz', `Lesson ${lessonNum}`, `Lesson 0${lessonNum}`),
        path.join('lesson quiz', `Lesson ${lessonNum}`, `Lesson ${lessonNum}`),
        path.join('lesson quiz', `Lesson${lessonNum}`, `Lesson 0${lessonNum}`),
        path.join('lesson quiz', `Lesson${lessonNum}`, `Lesson ${lessonNum}`)
      ];
      
      let actualDir = null;
      for (const dir of lessonDirOptions) {
        try {
          const stat = await fs.stat(dir);
          if (stat.isDirectory()) {
             const files = await fs.readdir(dir);
             if (files.some(f => f.endsWith('.docx'))) {
                 actualDir = dir;
                 break;
             }
             if (files.length === 1) {
                 const subDir = path.join(dir, files[0]);
                 const subStat = await fs.stat(subDir);
                 if (subStat.isDirectory()) {
                     actualDir = subDir;
                     break;
                 }
             }
          }
        } catch (e) {}
      }

      if (actualDir) {
        for (const part of session.parts) {
          const section = part.section; 
          const files = await fs.readdir(actualDir);
          let quizFile = files.find(f => {
            const lowerF = f.toLowerCase().replace(/\s+/g, ' ');
            return lowerF.includes(`${section} mcq`) || lowerF === `${section}.docx` || lowerF.includes(`${section} las`);
          });
          
          if (quizFile) {
            console.log(`Found quiz file for section ${section}: ${quizFile}`);
            const html = (await mammoth.convertToHtml({path: path.join(actualDir, quizFile)})).value;
            const parsedQuiz = await parseMCQHtml(html, `${section} Quiz`);
            if (parsedQuiz) {
              part.quiz = parsedQuiz;
              updatedCount++;
            }
          }
        }
        
        const files = await fs.readdir(actualDir);
        let finalFile = files.find(f => f.toLowerCase().includes('final') || f.toLowerCase().includes('fulll') || f.toLowerCase().includes('full lesson mcq') || f.toLowerCase().includes('las mcq'));
        if (finalFile) {
            console.log(`Found final quiz file for ${session.topic}: ${finalFile}`);
            const html = (await mammoth.convertToHtml({path: path.join(actualDir, finalFile)})).value;
            const parsedQuiz = await parseMCQHtml(html, `${session.topic} Final Quiz`);
            if (parsedQuiz) {
              session.finalQuiz = parsedQuiz;
            }
        }
      }
    }

    await fs.writeFile('src/lessons_data.json', JSON.stringify(sessions, null, 2));
    console.log(`Successfully updated ${updatedCount} quizzes in src/lessons_data.json`);

  } catch (err) {
    console.error(err);
  }
}

run();
