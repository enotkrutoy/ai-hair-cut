import { GoogleGenAI } from "@google/genai";
import { HairstyleConfig } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
];

const GENDER_MAP: Record<string, string> = {
  'Женский': 'Female',
  'Мужской': 'Male',
  'Не указано': 'Person'
};

async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    // Если ошибка связана с нулевым лимитом, повторы не помогут
    if (errorMsg.includes('limit: 0') || errorMsg.includes('BILLING_DISABLED')) {
      throw new Error("BILLING_REQUIRED");
    }

    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function prepareImage(base64: string, maxDim = 1024): Promise<{ data: string, mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = (h * maxDim) / w; w = maxDim; }
        else { w = (w * maxDim) / h; h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve({ data, mimeType: 'image/jpeg' });
    };
  });
}

export const enhanceImage = async (base64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const { data, mimeType } = await prepareImage(base64, 1536);

  const prompt = `Flux.1 Kontext Engine: High-End Photo Restoration. Restore face details, remove artifacts, 8k raw quality.`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
      config: { safetySettings: SAFETY_SETTINGS as any }
    });
    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!resultPart?.inlineData) throw new Error("Restoration failed");
    return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
  });
};

export const generateHairstyle = async (base64: string, config: HairstyleConfig): Promise<{ generated: string, original: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const { data, mimeType } = await prepareImage(base64, 1024);

  const prompt = `Flux.1 Pro Generation: Hairstyle "${config.style}", Color "${config.color}". Hyper-realistic, 8k photo.`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
      config: { safetySettings: SAFETY_SETTINGS as any }
    });
    const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!resultPart?.inlineData) throw new Error("Generation failed");
    return {
      generated: `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`,
      original: base64
    };
  });
};

export const generateCharacterImage = async (desc: string, style: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Flux.1 Creative: ${style}. ${desc}. 8k.`;
  const res = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
    config: { safetySettings: SAFETY_SETTINGS as any }
  });
  const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const generateSceneImage = async (base: string, char: string, scene: string, style: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const { data, mimeType } = await prepareImage(base, 1024);
  const prompt = `Flux.1 Contextual: ${scene}. Style: ${style}.`;
  const res = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
    config: { safetySettings: SAFETY_SETTINGS as any }
  });
  const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};