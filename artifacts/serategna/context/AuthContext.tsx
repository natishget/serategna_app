import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken, getToken, type UserProfile } from "@/lib/api";

export type UserRole = "worker" | "employer" | "agent" | "ministry";
export type { UserProfile };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, otp: string, role: UserRole) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  verifyFayda: (faydaId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "serategna_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try to restore session from stored token + user
        const [stored, token] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          getToken(),
        ]);
        if (stored && token) {
          setUser(JSON.parse(stored));
          // Silently refresh user data from API in background
          api.getMe().then(({ user: fresh }) => {
            setUser(fresh);
            AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
          }).catch(() => { /* Network offline — keep cached */ });
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone: string, otp: string, role: UserRole) => {
    try {
      const { token, user: profile } = await api.verifyOtp(phone, otp, role);
      await setToken(token);
      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (err: any) {
      // Fallback to mock for demo environments without backend
      if (err?.message?.includes("fetch") || err?.message?.includes("Network")) {
        const mockUser: UserProfile = {
          id: `${role[0]}-001`,
          phone,
          role,
          name: role === "worker" ? "Abebe Kebede" : role === "employer" ? "Tigist Alemu" : "Dawit Haile",
          faydaId: `FAYDA-2024-00${role === "worker" ? 1 : role === "employer" ? 2 : 3}`,
          faydaVerified: true,
          trustScore: role === "worker" ? 847 : role === "employer" ? 920 : 890,
          walletBalance: role === "worker" ? 3200 : role === "employer" ? 15000 : 8500,
          rating: role === "worker" ? 4.8 : role === "employer" ? 4.9 : 4.7,
          completedJobs: role === "worker" ? 142 : role === "employer" ? 37 : 0,
          skills: role === "worker" ? ["Plumbing", "Electrical", "Construction"] : [],
          location: { lat: 9.0245, lng: 38.7468, address: "Bole, Addis Ababa" },
          commissionRate: role === "agent" ? 200 : undefined,
        };
        setUser(mockUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return;
      }
      throw err;
    }
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    try {
      await api.sendOtp(phone);
    } catch (err: any) {
      // Fallback for demo
      if (err?.message?.includes("fetch") || err?.message?.includes("Network")) {
        return;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    await clearToken();
    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
      // Sync to API in background
      api.updateProfile(updates).then(({ user: fresh }) => {
        setUser(fresh);
        AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      }).catch(() => {});
      return next;
    });
  }, []);

  const verifyFayda = useCallback(async (faydaId: string): Promise<boolean> => {
    try {
      const { success, user: updated } = await api.verifyFayda(faydaId);
      if (success && updated) {
        setUser(updated);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return success;
    } catch {
      // Fallback: mock verification
      const isValid = faydaId.length >= 6;
      if (isValid) {
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, faydaId, faydaVerified: true };
          AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
          return next;
        });
      }
      return isValid;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, sendOtp, logout, updateProfile, verifyFayda }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
