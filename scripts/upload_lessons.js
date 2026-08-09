import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

async function parseMCQHtml(html, title) {
  const $ = cheerio.load(html);
  const questions = [];
  let currentQ = null;

  $('p').each((i, el) => {
    let text = $(el).text().trim();
    if (!text) return;

    const qMatch = text.match(/^(\d+)\.\s+(.*)/);
    if (qMatch) {
      if (currentQ) questions.push(currentQ);
      currentQ = {
        question: qMatch[2].trim(),
        options: {},
        correctOption: 'A'
      };
      return;
    }

    const optMatch = text.match(/^([A-D])\)\s+(.*)/);
    if (optMatch && currentQ) {
      const optLetter = optMatch[1];
      let optText = optMatch[2].trim();
      
      const hasStrong = $(el).find('strong').length > 0;
      if (hasStrong) {
        currentQ.correctOption = optLetter;
      }
      
      currentQ.options[optLetter] = optText;
    }
  });

  if (currentQ) questions.push(currentQ);

  if (questions.length > 0) {
    return {
      title: title,
      questions: questions
    };
  }
  return null;
}

async function convertDocxToHtmlWithImages(contentPath, lessonName, partName) {
  try {
    const result = await mammoth.convertToHtml({path: contentPath});
    const $html = cheerio.load(result.value);
    let imgIndex = 1;
    const imgDir = path.join('public', 'lesson_images', lessonName, partName);
    await fs.mkdir(imgDir, { recursive: true });

    $html('img').each((i, el) => {
      const src = $html(el).attr('src');
      if (src && src.startsWith('data:image/')) {
        const matches = src.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `img_${imgIndex}.${extension}`;
          const filePath = path.join(imgDir, fileName);
          
          import('fs').then(fsSync => {
            fsSync.writeFileSync(filePath, buffer);
          });

          $html(el).attr('src', `/lesson_images/${lessonName}/${partName}/${fileName}`);
          imgIndex++;
        }
      }
    });

    return $html('body').html() || $html.html();
  } catch (e) {
    console.error(`Failed to parse main lesson doc ${contentPath}:`, e);
    return "<p>Failed to load content.</p>";
  }
}

async function run() {
  const baseDir = 'Lesson 1 -10/Lesson 1 -10';
  const allSessions = [];
  
  try {
    const lessonFolders = await fs.readdir(baseDir);
    
    for (const lesson of lessonFolders) {
      const lessonPath = path.join(baseDir, lesson);
      const stat = await fs.stat(lessonPath);
      
      if (stat.isDirectory()) {
        let files = await fs.readdir(lessonPath);
        
        // If the directory only contains another directory (like Lesson 2/Lesson 02), go one level deeper
        let actualLessonPath = lessonPath;
        if (files.length === 1) {
          const subDirStat = await fs.stat(path.join(lessonPath, files[0]));
          if (subDirStat.isDirectory()) {
            actualLessonPath = path.join(lessonPath, files[0]);
            files = await fs.readdir(actualLessonPath);
          }
        }

        const partsMap = {};
        const quizzesMap = {};
        let finalQuiz = null;

        for (const file of files) {
          const lowerFile = file.toLowerCase();
          if (lowerFile.endsWith('.docx')) {
            if (lowerFile.includes('final') || lowerFile.includes('fulll')) {
              console.log(`Processing Final Quiz: ${file}`);
              const html = (await mammoth.convertToHtml({path: path.join(actualLessonPath, file)})).value;
              finalQuiz = await parseMCQHtml(html, file.replace('.docx', ''));
            } else if (lowerFile.includes('mcq') || lowerFile.includes('las') || file.match(/^([0-9]+)\.([0-9]+)\.docx$/)) {
              // file like "2.1.docx" or "1.1 MCQ.docx"
              const match = file.match(/([0-9\.]+)\s*(?:mcq|las)?/i) || file.match(/^([0-9\.]+)\.docx$/i);
              if (match) {
                let section = match[1];
                if (section.endsWith('.')) section = section.slice(0, -1);
                console.log(`Processing Quiz for section ${section}: ${file}`);
                const html = (await mammoth.convertToHtml({path: path.join(actualLessonPath, file)})).value;
                quizzesMap[section] = await parseMCQHtml(html, file.replace('.docx', ''));
              }
            } else if (lowerFile.includes('lesson')) {
              const match = file.match(/Lesson\s*([0-9\.]+)\.docx/i) || file.match(/^([0-9\.]+)\.docx/i);
              if (match) {
                let section = match[1];
                if (section.endsWith('.')) section = section.slice(0, -1);
                partsMap[section] = file;
              }
            }
          }
        }

        const sections = Object.keys(partsMap).sort((a, b) => {
          const aParts = a.split('.').map(Number);
          const bParts = b.split('.').map(Number);
          for(let i=0; i<Math.max(aParts.length, bParts.length); i++) {
             if((aParts[i]||0) !== (bParts[i]||0)) return (aParts[i]||0) - (bParts[i]||0);
          }
          return 0;
        });

        const lessonParts = [];
        for (const section of sections) {
          console.log(`Processing content for section ${section}: ${partsMap[section]}`);
          const contentPath = path.join(actualLessonPath, partsMap[section]);
          const html = await convertDocxToHtmlWithImages(contentPath, lesson, section);
          lessonParts.push({
            section: section,
            content: html,
            quiz: quizzesMap[section] || null
          });
        }

        if (lessonParts.length > 0) {
          allSessions.push({
            teacherId: 'system',
            teacherName: 'Admin',
            subject: "Science",
            topic: lesson,
            duration: 45,
            parts: lessonParts,
            finalQuiz: finalQuiz,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
    
    await fs.writeFile('src/lessons_data.json', JSON.stringify(allSessions, null, 2));
    console.log(`Saved ${allSessions.length} sessions to src/lessons_data.json!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
