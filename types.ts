
export type Gender = 'Женский' | 'Мужской' | 'Не указано';

export type Resolution = '1k' | '2k' | '4k';

export interface HairstyleConfig {
  gender: Gender;
  style: string;
  color: string;
  volume: 'natural' | 'medium' | 'high';
  prompt: string;
  resolution: Resolution;
}

export interface GenerationResult {
  id: string;
  originalImage: string; // Base64
  generatedImage: string; // Base64
  config: HairstyleConfig;
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  baseImage: string; // Base64
  createdAt: number;
}

export interface Scene {
  id: string;
  characterId: string;
  description: string;
  image: string; // Base64
  timestamp: number;
}

export type ViewState = 'landing' | 'studio';

export type LoadingState = 'idle' | 'enhancing' | 'generating' | 'error' | 'generating-character' | 'generating-scene';
