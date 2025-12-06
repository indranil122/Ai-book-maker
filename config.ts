
// Check for Vite environment usage
const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  // Fallback to process.env shim if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key as any];
  }
  return undefined;
};

export const getApiKey = (): string | null => {
  // 1. Check LocalStorage (User Override)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('LUMINA_GOOGLE_API_KEY');
    if (stored) return stored;
  }

  // 2. Check Environment Variables
  const envKey = getEnvVar('VITE_GOOGLE_API_KEY') || getEnvVar('GOOGLE_API_KEY');
  if (envKey) return envKey;

  return null;
};

export const hasValidApiKey = (): boolean => {
  const key = getApiKey();
  return !!key && key.length > 0;
};

export const saveApiKey = (key: string) => {
  localStorage.setItem('LUMINA_GOOGLE_API_KEY', key.trim());
};

export const clearApiKey = () => {
  localStorage.removeItem('LUMINA_GOOGLE_API_KEY');
};
