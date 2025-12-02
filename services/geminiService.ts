import { GoogleGenAI } from "@google/genai";
import { HairstyleConfig } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

// Configuration for Adversarial Testing (Safety Filters Disabled)
// Using strings to avoid Enum import issues with different SDK versions
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

// Expanded STYLE_MAP based on Flux AI description
const STYLE_MAP: Record<string, string> = {
  // Classics
  "Прямая стрижка": "Straight Haircut, neat ends, smooth texture",
  "Длинные прямые волосы": "Long Straight Hair, sleek and shiny, falling down back",
  "Каре": "Classic Bob Cut, chin length, sharp lines",
  "Французское каре": "French Bob, cheekbone length, with bangs, chic style",
  "Удлиненное каре (лоб)": "Long Bob (Lob), shoulder grazing, modern",
  "Боб-каре": "Graduated Bob, volume at back, angled front",
  "Пикси": "Short Pixie Cut, textured, open neck",
  "Гарсон": "Garçon cut, very short feminine style, tomboy look",
  
  // Waves & Curls
  "Пляжные волны": "Beach Waves, textured, salt-spray look, messy but styled",
  "Свободные локоны": "Loose Curls, romantic, soft bounce",
  "Плотные кудри": "Tight Curls, high density, springy texture",
  "Голливудские волны": "Old Hollywood Waves, glossy, deep side part, glamour",
  "Кудрявое каре": "Curly Bob, voluminous ringlets",
  "Химическая завивка": "Perm / Curly Perm, uniform curl pattern, high volume",
  "Каскад": "Layered Cut / Cascade, face-framing layers, dynamic volume",
  "Шегги": "Shag Cut, choppy layers, messy rock-n-roll texture",
  "Волф-кат": "Wolf Cut, heavy layers, mullet hybrid, trendy messy look",

  // Braids & Buns
  "Коса-ободок": "Braided Headband, milkmaid braid style across top of head",
  "Коса 'Колосок'": "French Braid, neat single braid",
  "Афрокосички (Box Braids)": "Box Braids, long, distinct sections",
  "Косы (Cornrows)": "Cornrows, tight braids close to scalp",
  "Низкий пучок": "Low Bun, sleek, professional, neat nape",
  "Гладкий пучок": "Sleek High Bun, pulled back tight, clean girl aesthetic",
  "Небрежный пучок": "Messy Bun, loose strands, casual",
  "Два пучка (Space Buns)": "Space Buns, double high buns, playful",
  "Половина наверху-половина внизу": "Half-up Half-down hairstyle, top tied back, bottom loose",

  // Short / Mens / Unisex
  "Афро": "Round Afro, natural texture, medium volume",
  "Кудрявое афро": "Textured Afro, defined coils",
  "Дреды": "Dreadlocks, medium length, matured locs",
  "Дреды (Короткие)": "Short Dreadlocks, styled up or forward",
  "Базз-кат": "Buzz Cut, military grade, extremely short",
  "Налысо": "Bald head, smooth skin, realistic lighting",
  "Фейд": "Skin Fade, gradient from bald to hair",
  "Тейпер фейд": "Taper Fade, clean sideburns and neckline",
  "Андеркат": "Undercut, shaved sides, long top",
  "Высокий и короткий": "High and Tight, military style, very short sides",
  "Цезарь": "Caesar Cut, short straight fringe, consistent length",
  "Французский кроп": "French Crop, textured top, blunt fringe, faded sides",
  "Текстурированный кроп": "Textured Crop, messy top, matte finish",
  "Квифф": "Quiff, voluminous forelock combed upwards and back",
  "Помпадур": "Pompadour, high volume swept back, rockabilly",
  "Зачёс назад": "Slicked Back, wet look, mafia style",
  "Зачёс набок": "Side Swept, classic gentleman look",
  "Боковой пробор": "Hard Side Part, defined line, neat combing",
  "Бро Флоу": "Bro Flow, medium length pushed back, relaxed surfer style",
  "Челка-занавеска": "Curtain Bangs, parted in middle, framing face",
  "Челка набок": "Side Bangs, sweeping across forehead",
  "Маллет": "Mullet, business in front, party in back",
  "Ирокез": "Mohawk, shaved sides, central strip standing up",
  "Фальшивый ирокез": "Faux Hawk, shorter sides (not shaved), spiked center",
  "Канадка": "Canadian Cut / Taper Cut, volume at front, shorter back",
  "Айви Лига": "Ivy League Cut, polished short hair, side part possible",
  "Мужской пучок": "Man Bun / Top Knot, shaved sides or full length tied up",
  "Асимметрия": "Asymmetrical Cut, uneven lengths, edgy"
};

const VOLUME_MAP: Record<string, string> = {
  'natural': "Natural/Low hair volume, lying flat against head, realistic gravity",
  'medium': "Medium hair volume, healthy density, standard daily look",
  'high': "High volume, voluminous, airy, lifted roots, thick glam appearance"
};

// Expanded COLOR_MAP based on Flux AI description
const COLOR_MAP: Record<string, string> = {
  "Чёрный": "Natural Soft Black",
  "Темно-каштановый": "Dark Brown / Espresso",
  "Каштановый": "Chestnut Brown",
  "Светло-каштановый": "Light Brown / Mousy Brown",
  "Рыжевато-каштановый": "Auburn / Reddish Brown",
  "Блондин": "Natural Golden Blonde",
  "Платиновый блонд": "Platinum / Icy Blonde",
  "Пепельно-серый": "Ash Grey / Matte Grey",
  "Серебристый": "Silver / White Hair",
  "Пастельно-розовый": "Pastel Pink (dyed)",
  "Рыжий": "Natural Ginger / Copper",
  "Синий": "Dark Midnight Blue (dyed)",
  "Зелёный": "Dark Forest Green (dyed)"
};

interface ApiError {
    status?: number;
    code?: number;
    message?: string;
}

function isApiError(error: unknown): error is ApiError {
    return typeof error === 'object' && error !== null;
}

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
    
    // Critical Billing Check
    if (isQuotaError && (errorMessage.includes('limit: 0') || errorMessage.includes('FreeTier'))) {
        console.error("Billing Quota Error:", error);
        throw new Error("Ошибка доступа (Limit: 0). Для генерации изображений требуется привязать карту в Google AI Studio.");
    }

    if (retries > 0 && (isQuotaError || isServerError)) {
      const waitTime = isQuotaError ? Math.max(delay, 5000) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return retryOperation(operation, retries - 1, waitTime * 2);
    }
    
    if (isQuotaError) {
        throw new Error("Сервер перегружен. Пожалуйста, подождите 30 секунд.");
    }

    throw error;
  }
}

async function processImageForApi(base64Str: string, maxWidth = 1024, quality = 0.9): Promise<{ data: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      // Even dimensions rule for Gemini
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

export const enhanceImage = async (originalImageBase64: string, maxDimension = 1536): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Reduced maxDimension to prevent 500 RPC errors
  const { data: cleanBase64, mimeType } = await processImageForApi(originalImageBase64, Math.min(maxDimension, 1536), 0.95);

  const prompt = `
    TASK: STRICT 2-STEP IMAGE RESTORATION & CLEANUP.

    STEP 1: FACTUAL ANALYSIS
    - Identify all overlays: watermarks, logos, text, subtitles, UI buttons, timestamps.
    - Identify artifacts: compression blocks, noise, blur.
    - Identify features: skin texture, hair strands, eyes, lighting.

    STEP 2: RESTORATION ACTION
    1. DELETE OVERLAYS: Remove ALL text, logos, watermarks, timestamps, and UI elements found in Step 1. Inpaint the area to match background/clothing seamlessly.
    2. RECOVER TEXTURE: Sharpen individual hair strands and skin pores using the original pixel data as a reference.
    3. NOISE REDUCTION: Remove digital grain without smoothing the face.
    4. IDENTITY LOCK: Do NOT change facial geometry, expression, or age.

    OUTPUT: 8k resolution, raw photo quality, CLEAN image without any text/logos/watermarks.
  `;

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
        responseModalities: ['IMAGE'],
        safetySettings: SAFETY_SETTINGS as any
      }
    });

    const candidate = response.candidates?.[0];
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    if (candidate?.finishReason === 'SAFETY') throw new Error("Запрос отклонен фильтром безопасности.");
    throw new Error("Не удалось улучшить изображение.");
  });
};

export const generateHairstyle = async (
  originalImageBase64: string,
  config: HairstyleConfig,
  maxDimension = 1536,
  quality = 0.95
): Promise<{ generated: string; original: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Safety cap limits to prevent "500 Rpc failed" due to large payloads
  let targetDimension = 1024;
  if (config.resolution === '1k') targetDimension = 768;
  else if (config.resolution === '2k') targetDimension = 1024; 
  else if (config.resolution === '4k') targetDimension = 1536; // Capped at 1536 for stability

  const { data: cleanBase64, mimeType } = await processImageForApi(originalImageBase64, targetDimension, quality);
  const processedOriginal = `data:${mimeType};base64,${cleanBase64}`;

  const engGender = GENDER_MAP[config.gender] || config.gender;
  const engStyle = STYLE_MAP[config.style] || config.style;
  const engColor = COLOR_MAP[config.color] || config.color;
  const engVolume = VOLUME_MAP[config.volume] || VOLUME_MAP['medium'];

  const prompt = `
    ROLE: Senior Hair Stylist & CGI Expert. TASK: Hyper-Realistic Digital Hair Replacement.
    
    INPUT: ${engGender} Subject.
    GOAL: Apply "${engStyle}" hairstyle in "${engColor}".
    VOLUME: ${engVolume}.
    ${config.prompt ? `USER NOTE: ${config.prompt}` : ''}
    
    RENDERING ENGINE RULES (MACRO PHOTOGRAPHY QUALITY):
    1. HAIR PHYSICS: Render INDIVIDUAL HAIR STRANDS with distinct separation. No "helmet" or "solid block" hair.
    2. TEXTURE: Anisotropic specular highlights, distinct follicle details, flyaways for realism.
    3. EDGES: Sharp, defined hairline (no blurring/feathering mask artifacts).
    4. IDENTITY LOCK: Face features, skin texture, and expression must be EXACTLY preserved. 
    5. LIGHTING: Volumetric lighting interacting with hair depth.
    6. CLEANUP: Ensure no watermarks or text appear in the final render.
    7. REALISM: 8k resolution, raw photo quality, no "cartoon" look, no motion blur.
  `;

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
        responseModalities: ['IMAGE'],
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
      if (part.text) {
          throw new Error(`ИИ отказался выполнить запрос: ${part.text.substring(0, 50)}...`);
      }
    }
    if (candidate?.finishReason === 'SAFETY') throw new Error("Фото отклонено фильтром безопасности.");
    throw new Error("Пустой ответ от ИИ.");
  });
};

export const generateCharacterImage = async (description: string, style: string): Promise<string> => {
    return ""; 
};
export const generateSceneImage = async (base: string, char: string, scene: string, style: string): Promise<string> => {
    return "";
};