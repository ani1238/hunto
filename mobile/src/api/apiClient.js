import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

const AUTH_TOKEN_KEY = "dwiggy_auth_token";

const getDevHostBaseUrl = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL || "";
  const match = scriptURL.match(/https?:\/\/([^/:]+)/);
  if (!match?.[1]) {
    return "http://localhost:3000";
  }
  return `http://${match[1]}:3000`;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || getDevHostBaseUrl();

export const setAuthToken = async (token) => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async () => AsyncStorage.getItem(AUTH_TOKEN_KEY);

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

export const apiRequest = async (path, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Network request failed to ${API_BASE_URL}. Set EXPO_PUBLIC_API_BASE_URL to your backend host (e.g. http://192.168.1.24:3000).`
    );
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};
