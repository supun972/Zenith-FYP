import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = "AIzaSyA3609Q5LtlBDFTNazuMH3w9Z_P6Yj15hM";
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("AVAILABLE MODELS:");
    data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
  } catch(e) {
    console.error(e);
  }
}

listModels();
