import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqohD7LafhOHKYcPddmeYu2pBAsNh4vvE",
  authDomain: "zenith-e41ba.firebaseapp.com",
  projectId: "zenith-e41ba",
  storageBucket: "zenith-e41ba.firebasestorage.app",
  messagingSenderId: "378419705172",
  appId: "1:378419705172:web:cf6a5ce50cc1768a4f84c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lessons = JSON.parse(readFileSync('./src/lessons_data.json', 'utf8'));

async function upload() {
  console.log('Uploading lessons to Firestore...');
  for (const lesson of lessons) {
    try {
      await addDoc(collection(db, 'study_sessions'), lesson);
      console.log('Uploaded lesson:', lesson.topic);
    } catch (e) {
      console.error('Failed to upload:', lesson.topic, e);
    }
  }
  console.log('Done! Database restored.');
  process.exit(0);
}

upload();
