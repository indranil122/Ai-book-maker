
import { User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock validation
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    // Simulate successful login
    return {
      id: 'user-' + Date.now(),
      name: email.split('@')[0], // Use part of email as name
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    };
  },

  loginWithGoogle: async (): Promise<User> => {
    // Simulate OAuth popup delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      id: 'google-user-' + Date.now(),
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' // Generic Google-like avatar
    };
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!name || !email || !password) {
      throw new Error('All fields are required.');
    }

    return {
      id: 'user-' + Date.now(),
      name: name,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
    };
  }
};