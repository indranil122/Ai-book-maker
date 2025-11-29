
export enum ViewState {
  LANDING = 'LANDING',
  WIZARD = 'WIZARD',
  EDITOR = 'EDITOR',
  READER = 'READER',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Character {
  name: string;
  role: string;
  description: string;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  content: string;
  isGenerated: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  tone: string;
  targetAudience: string;
  coverImage?: string; // URL
  chapters: Chapter[];
  characters: Character[];
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GenerationParams {
  title: string;
  genre: string;
  tone: string;
  audience: string;
  prompt: string;
}
