import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "serategna_token";
const API_KEY_STORAGE = "serategna_api_key";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getStoredApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, API_KEY_STORAGE]);
}
