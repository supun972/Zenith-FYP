import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearSessions() {
  console.log("Fetching existing study sessions...");
  const snapshot = await getDocs(collection(db, "study_sessions"));
  console.log(`Found ${snapshot.docs.length} sessions. Deleting them now...`);
  
  let deletedCount = 0;
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, "study_sessions", document.id));
    deletedCount++;
  }
  
  console.log(`Successfully deleted ${deletedCount} sessions!`);
  process.exit(0);
}

clearSessions().catch(console.error);
