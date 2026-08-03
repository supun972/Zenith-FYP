import mammoth from 'mammoth';

async function parse() {
  const filePath = 'lessons_extracted/Lesson 1 -10/Lesson 1/1.1 MCQ.docx';
  try {
    const result = await mammoth.convertToHtml({path: filePath});
    console.log(result.value.substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
}
parse();
