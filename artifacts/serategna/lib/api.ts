import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  clearStoredSession,
  getStoredApiKey,
  getStoredToken,
  setStoredToken,
} from "./session";

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() || "8080";
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i;
const IPV4_HOST_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimTrailingSlash(trimmed);
  }

  const useHttp =
    LOCAL_HOST_PATTERN.test(trimmed) || IPV4_HOST_PATTERN.test(trimmed);
  return `${useHttp ? "http" : "https"}://${trimTrailingSlash(trimmed)}`;
}

function extractHost(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`,
    );
    return url.hostname || null;
  } catch {
    const withoutProtocol = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const host = withoutProtocol.split("/")[0]?.split(":")[0];
    return host || null;
  }
}

function getExpoDevHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.manifest2?.debuggerHost,
    Constants.experienceUrl,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

function resolveBaseUrl(): string {
  const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitApiUrl) {
    return normalizeBaseUrl(explicitApiUrl);
  }

  const explicitDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (explicitDomain) {
    return `${normalizeBaseUrl(explicitDomain)}/api`;
  }

  if (Platform.OS === "web") {
    const browserOrigin = (globalThis as { location?: { origin?: string } })
      .location?.origin;
    if (browserOrigin) {
      return `${trimTrailingSlash(browserOrigin)}/api`;
    }
  }

  const expoDevHost = getExpoDevHost();
  if (expoDevHost) {
    return `http://${expoDevHost}:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

const BASE_URL = resolveBaseUrl();

export async function getToken(): Promise<string | null> {
  return getStoredToken();
}
export async function setToken(token: string): Promise<void> {
  await setStoredToken(token);
}
export async function clearToken(): Promise<void> {
  await clearStoredSession();
}

export async function clearSession(): Promise<void> {
  await clearStoredSession();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authenticated) {
    const [token, apiKey] = await Promise.all([
      getStoredToken(),
      getStoredApiKey(),
    ]);
    if (apiKey) headers["X-API-Key"] = apiKey;
    else if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw Object.assign(new Error(err.error ?? "Request failed"), {
      status: resp.status,
    });
  }

  return resp.json() as Promise<T>;
}

export const api = {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  sendOtp: (phone: string) =>
    request<{ success: boolean; code?: string; existingUser: boolean }>(
      "POST",
      "/auth/otp/send",
      { phone },
      false,
    ),

  verifyOtp: (phone: string, code: string, role: string, name?: string) =>
    request<{ token: string; user: UserProfile; isNewUser: boolean }>(
      "POST",
      "/auth/otp/verify",
      { phone, code, role, name },
      false,
    ),

  verifyFayda: (faydaId: string) =>
    request<{ success: boolean; user: UserProfile }>(
      "POST",
      "/auth/fayda/verify",
      { faydaId },
    ),

  getMe: () => request<{ user: UserProfile }>("GET", "/auth/me"),

  logout: () =>
    request<{ success: boolean }>("POST", "/auth/logout", undefined, false),

  // ─── Users ─────────────────────────────────────────────────────────────────
  updateProfile: (
    updates: Partial<UserProfile> & {
      employerType?: EmployerType;
      orgName?: string;
      orgLicense?: string;
      massHireQuota?: number;
      ministryCode?: MinistryCode;
    },
  ) => request<{ user: UserProfile }>("PATCH", "/users/me", updates),

  generateApiKey: () =>
    request<{ data: { apiKey: string }; message: string }>(
      "POST",
      "/users/me/api-key",
      {},
    ),

  getWorkers: (params?: {
    category?: string;
    q?: string;
    faydaOnly?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const p = new URLSearchParams();
    if (params?.category) p.set("category", params.category);
    if (params?.q) p.set("q", params.q);
    if (params?.faydaOnly !== undefined)
      p.set("faydaOnly", String(params.faydaOnly));
    if (params?.page) p.set("page", String(params.page));
    if (params?.limit) p.set("limit", String(params.limit));
    return request<
      PaginatedResponse<WorkerProfile> & { workers: WorkerProfile[] }
    >("GET", `/users/workers?${p}`);
  },

  getEmployers: (params?: {
    employerType?: EmployerType;
    ministryCode?: string;
    q?: string;
    page?: number;
  }) => {
    const p = new URLSearchParams();
    if (params?.employerType) p.set("employerType", params.employerType);
    if (params?.ministryCode) p.set("ministryCode", params.ministryCode);
    if (params?.q) p.set("q", params.q);
    if (params?.page) p.set("page", String(params.page));
    return request<
      PaginatedResponse<EmployerProfile> & { employers: EmployerProfile[] }
    >("GET", `/users/employers?${p}`);
  },

  getUser: (id: string) =>
    request<{ user: UserProfile }>("GET", `/users/${id}`),

  // ─── Jobs ──────────────────────────────────────────────────────────────────
  getJobs: (params?: JobFilterParams) => {
    const p = new URLSearchParams();
    if (params?.jobType) p.set("jobType", params.jobType);
    if (params?.category) p.set("category", params.category);
    if (params?.status) p.set("status", params.status);
    if (params?.urgency) p.set("urgency", params.urgency);
    if (params?.isRemote !== undefined)
      p.set("isRemote", String(params.isRemote));
    if (params?.page) p.set("page", String(params.page));
    if (params?.limit) p.set("limit", String(params.limit));
    return request<PaginatedResponse<JobData> & { jobs: JobData[] }>(
      "GET",
      `/jobs?${p}`,
    );
  },

  createJob: (data: CreateJobInput) =>
    request<{ data: JobData; job: JobData }>("POST", "/jobs", data),

  bulkCreateJobs: (jobs: CreateJobInput[]) =>
    request<{ data: JobData[]; meta: { created: number } }>(
      "POST",
      "/jobs/bulk",
      { jobs },
    ),

  getJob: (id: string) =>
    request<{ data: JobData; job: JobData }>("GET", `/jobs/${id}`),

  acceptJob: (id: string) =>
    request<{ data: JobData; job: JobData }>("POST", `/jobs/${id}/accept`, {}),

  fundEscrow: (id: string, method: PaymentMethod) =>
    request<{ data: JobData; job: JobData }>(
      "POST",
      `/jobs/${id}/fund-escrow`,
      { method },
    ),

  startJob: (id: string) =>
    request<{ data: JobData; job: JobData }>("POST", `/jobs/${id}/start`, {}),

  completeJob: (id: string) =>
    request<{ data: JobData; job: JobData }>(
      "POST",
      `/jobs/${id}/complete`,
      {},
    ),

  rateJob: (id: string, score: number, feedback?: string) =>
    request<{ data: JobData; job: JobData }>("POST", `/jobs/${id}/rate`, {
      score,
      feedback,
    }),

  // ─── Disputes ──────────────────────────────────────────────────────────────
  createDispute: (data: CreateDisputeInput) =>
    request<{ dispute: DisputeData }>("POST", "/disputes", data),

  getDisputes: () => request<{ disputes: DisputeData[] }>("GET", "/disputes"),

  // ─── Finance ───────────────────────────────────────────────────────────────
  getFinanceProducts: () =>
    request<{
      trustScore: number;
      products: FinanceProduct[];
      eligibleCount: number;
    }>("GET", "/finance/products"),

  applyForLoan: (productId: string, requestedAmount: number) =>
    request<{ success: boolean; referenceId: string; message: string }>(
      "POST",
      "/finance/apply",
      { productId, requestedAmount },
    ),

  // ─── Chat ──────────────────────────────────────────────────────────────────
  getChatRooms: () => request<{ rooms: ChatRoomData[] }>("GET", "/chat/rooms"),

  getMessages: (roomId: string) =>
    request<{ messages: ChatMessageData[] }>(
      "GET",
      `/chat/rooms/${roomId}/messages`,
    ),

  sendMessage: (roomId: string, content: string, type = "text") =>
    request<{ message: ChatMessageData }>(
      "POST",
      `/chat/rooms/${roomId}/messages`,
      { content, type },
    ),
};

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmployerType =
  | "individual"
  | "company"
  | "mass_hire"
  | "vip"
  | "ministry"
  | "ngo"
  | "startup";

export type JobType =
  | "informal"
  | "formal"
  | "gig"
  | "short_run"
  | "contract"
  | "seasonal"
  | "professional"
  | "emergency"
  | "remote"
  | "internship"
  | "mass_hire";

export type JobCategory =
  | "plumbing"
  | "electrical"
  | "construction"
  | "carpentry"
  | "welding"
  | "painting"
  | "cleaning"
  | "cooking"
  | "gardening"
  | "moving"
  | "childcare"
  | "eldercare"
  | "driving"
  | "delivery"
  | "logistics"
  | "security"
  | "bodyguard"
  | "it_tech"
  | "finance_admin"
  | "legal"
  | "healthcare"
  | "education"
  | "engineering"
  | "agriculture"
  | "livestock"
  | "fishing"
  | "hospitality"
  | "retail"
  | "events"
  | "arts_media"
  | "tailoring"
  | "hairdressing"
  | "manufacturing"
  | "other";

export type MinistryCode =
  | "MoLSA"
  | "MoE"
  | "MoF"
  | "MoH"
  | "MoA"
  | "MoT"
  | "MoI"
  | "MoD"
  | "MoJ"
  | "MoWIE"
  | "other";

export type PaymentMethod = "telebirr" | "cbe" | "bank_transfer" | "cash";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; hasMore: boolean };
}

export interface UserProfile {
  id: string;
  phone: string;
  role: "worker" | "employer" | "agent" | "ministry";
  name: string;
  faydaId?: string;
  faydaVerified: boolean;
  birthDate?: string;
  trustScore: number;
  walletBalance: number;
  rating: number;
  completedJobs: number;
  skills?: string[];
  location?: { lat: number; lng: number; address: string };
  commissionRate?: number;
  // Employer fields
  employerType?: EmployerType;
  orgName?: string;
  orgLicense?: string;
  massHireQuota?: number;
  isVip?: boolean;
  ministryCode?: MinistryCode;
  hasApiKey?: boolean;
}

export interface WorkerProfile {
  id: string;
  name: string;
  trustScore: number;
  rating: number;
  completedJobs: number;
  skills: string[];
  location?: { lat: number; lng: number; address: string };
  faydaVerified: boolean;
  isAvailable: boolean;
  estimatedDailyRate: number;
}

export interface EmployerProfile {
  id: string;
  name: string;
  employerType?: EmployerType;
  orgName?: string;
  orgLicense?: string;
  ministryCode?: MinistryCode;
  isVip: boolean;
  massHireQuota?: number;
  trustScore: number;
  rating: number;
  location?: { lat: number; lng: number; address: string };
  faydaVerified: boolean;
}

export interface JobFilterParams {
  jobType?: JobType;
  category?: JobCategory;
  status?: string;
  urgency?: "flexible" | "normal" | "urgent";
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export interface JobData {
  id: string;
  employerId: string;
  employerName: string;
  employerType?: EmployerType;
  orgName?: string;
  workerId?: string;
  workerName?: string;
  title: string;
  description: string;
  jobType: JobType;
  category: JobCategory;
  tags: string[];
  requirements: string[];
  status: string;
  price: number;
  workerAmount: number;
  platformFee: number;
  agentCommission: number;
  tax: number;
  split: { worker: string; platform: string; agent: string; tax: string };
  location: { lat: number; lng: number; address: string };
  isRemote: boolean;
  urgency: "flexible" | "normal" | "urgent";
  scheduledAt?: string;
  durationDays?: number;
  workerCount: number;
  workersFilled: number;
  escrowStatus: string;
  paymentMethod?: PaymentMethod;
  aiGenerated: boolean;
  isPublic: boolean;
  externalRef?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  jobType?: JobType;
  category: JobCategory;
  tags?: string[];
  requirements?: string[];
  price: number;
  location: { lat: number; lng: number; address: string };
  isRemote?: boolean;
  urgency?: "flexible" | "normal" | "urgent";
  scheduledAt?: string;
  durationDays?: number;
  workerCount?: number;
  aiGenerated?: number;
  isPublic?: boolean;
  externalRef?: string;
}

export interface DisputeData {
  id: string;
  referenceId: string;
  jobId: string;
  raisedBy: string;
  disputeType: string;
  description: string;
  preferredResolution: string;
  status: string;
  createdAt: string;
}

export interface CreateDisputeInput {
  jobId: string;
  disputeType: string;
  description: string;
  preferredResolution: string;
  evidenceNotes?: string;
}

export interface FinanceProduct {
  id: string;
  bank: string;
  bankShort: string;
  type: string;
  product: string;
  maxAmount: number;
  ratePercent: number;
  termMonths: number;
  minScore: number;
  color: string;
  features: string[];
  eligible: boolean;
}

export interface ChatRoomData {
  id: string;
  jobId: string;
  participants: string[];
  lastMessage?: ChatMessageData;
  otherUser?: { id: string; name: string };
}

export interface ChatMessageData {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}
