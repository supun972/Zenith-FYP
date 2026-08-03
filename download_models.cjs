const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

files.forEach(file => {
  https.get(baseUrl + file, (res) => {
    const filePath = path.join(modelsDir, file);
    const writeStream = fs.createWriteStream(filePath);
    res.pipe(writeStream);
    writeStream.on('finish', () => {
      writeStream.close();
      console.log('Downloaded', file);
    });
  });
});
