
// @ts-nocheck
import { GoogleGenAI } from "@google/genai";
import { HairstyleConfig } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

// Configuration for Adversarial Testing (Safety Filters Disabled)
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

interface ApiError {
    status?: number;
    code?: number;
    message?: string;
}

function isApiError(error: unknown): error is ApiError {
    return typeof error === 'object' && error !== null;
}

// Robust retry logic for API reliability
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    let status: number | undefined;

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (isApiError(error)) {
        errorMessage = error.message || "API Error";
        status = error.status || error.code;
    }

    const isQuotaError = status === 429 || errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
    const isServerError = status && status >= 500 && status < 600;
    
    if (retries > 0 && (isQuotaError || isServerError)) {
      const waitTime = isQuotaError ? Math.max(delay, 5000) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return retryOperation(operation, retries - 1, waitTime * 2);
    }
    
    throw error;
  }
}

// Helper to prepare image for API (resizing and converting to base64)
async function processImageForApi(base64Str: string, maxWidth = 1024, quality = 0.9): Promise<{ data: string, mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      // Gemini often requires even dimensions for image inputs
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const cleanData = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
        resolve({ data: cleanData, mimeType: 'image/png' }); 
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const newBase64 = canvas.toDataURL('image/jpeg', quality);
      const data = newBase64.split(',')[1];
      resolve({ data, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      const cleanData = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
      resolve({ data: cleanData, mimeType: 'image/png' });
    };
  });
}

// Fix: Updated signature to accept maxDimension as required by HairstyleStudio component
export const enhanceImage = async (originalImageBase64: string, maxDimension = 1536): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { data: cleanBase64, mimeType } = await processImageForApi(originalImageBase64, maxDimension, 0.95);

  const prompt = "TASK: Restore and clean up image. Remove artifacts, text, watermarks. Sharpen details. 8k resolution.";

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: prompt }
        ],
      },
      config: {
        safetySettings: SAFETY_SETTINGS as any
      }
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to enhance image.");
  });
};

// Fix: Updated signature to accept quality parameter as required by HairstyleStudio component
export const generateHairstyle = async (
  originalImageBase64: string,
  config: HairstyleConfig,
  maxDimension = 1536,
  quality = 0.95
): Promise<{ generated: string; original: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { data: cleanBase64, mimeType } = await processImageForApi(originalImageBase64, maxDimension, quality);
  const processedOriginal = `data:${mimeType};base64,${cleanBase64}`;

  const prompt = `Apply ${config.style} hairstyle in ${config.color} for a ${GENDER_MAP[config.gender] || 'person'}. Volume: ${config.volume}. Preserve face identity perfectly. 8k resolution, photorealistic.`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: prompt }
        ],
      },
      config: {
        safetySettings: SAFETY_SETTINGS as any
      }
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return { 
            generated: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
            original: processedOriginal 
        };
      }
    }
    throw new Error("Failed to generate hairstyle image.");
  });
};

// Fix: Added missing export generateCharacterImage required by CharacterStudio
export const generateCharacterImage = async (description: string, style: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Create a character profile. Description: ${description}. Style: ${style}. High resolution, 8k, photorealistic details.`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        safetySettings: SAFETY_SETTINGS as any
      }
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate character image.");
  });
};

// Fix: Added missing export generateSceneImage required by CharacterStudio
export const generateSceneImage = async (baseImage: string, charDesc: string, scenePrompt: string, style: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase = baseImage.includes(',') ? baseImage.split(',')[1] : baseImage;

  const prompt = `Place the character described as "${charDesc}" into this specific scene: "${scenePrompt}". Style: ${style}. Maintain character facial features from the provided reference image. 8k, hyper-realistic.`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase } },
          { text: prompt }
        ]
      },
      config: {
        safetySettings: SAFETY_SETTINGS as any
      }
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate scene image.");
  });
};
