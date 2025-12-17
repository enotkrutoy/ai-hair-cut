
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Мок для URL.createObjectURL (используется при работе с изображениями)
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn();
}

// Мок для Google GenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn()
    }
  })),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY'
  }
}));
