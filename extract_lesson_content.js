import mammoth from 'mammoth';

async function parse() {
  const filePath = 'lessons_extracted/Lesson 1 -10/Lesson 1/Lesson_01_Microorganisms_and_Their_Uses.docx';
  try {
    const result = await mammoth.convertToHtml({path: filePath});
    console.log(result.value.substring(0, 3000));
  } catch (err) {
    console.error(err);
  }
}
parse();
