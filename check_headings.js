import fs from 'fs/promises';

async function check() {
  const html = await fs.readFile('lesson1_dump.html', 'utf8');
  console.log("Images:", html.match(/<img/g)?.length);
}
check();
