import { z } from "zod";

export const AUTH_ROLES = ["worker", "employer", "agent", "ministry"] as const;
export const JOB_TYPES = [
  "informal",
  "formal",
  "gig",
  "short_run",
  "contract",
  "seasonal",
  "professional",
  "emergency",
  "remote",
  "internship",
  "mass_hire",
] as const;
export const JOB_CATEGORIES = [
  "plumbing",
  "electrical",
  "construction",
  "carpentry",
  "welding",
  "painting",
  "cleaning",
  "cooking",
  "gardening",
  "moving",
  "childcare",
  "eldercare",
  "driving",
  "delivery",
  "logistics",
  "security",
  "bodyguard",
  "it_tech",
  "finance_admin",
  "legal",
  "healthcare",
  "education",
  "engineering",
  "agriculture",
  "livestock",
  "fishing",
  "hospitality",
  "retail",
  "events",
  "arts_media",
  "tailoring",
  "hairdressing",
  "manufacturing",
  "other",
] as const;
export const JOB_URGENCIES = ["flexible", "normal", "urgent"] as const;
export const PAYMENT_METHODS = [
  "telebirr",
  "cbe",
  "bank_transfer",
  "cash",
] as const;
export const EMPLOYER_TYPES = [
  "individual",
  "company",
  "mass_hire",
  "vip",
  "ministry",
  "ngo",
  "startup",
] as const;
export const MINISTRY_CODES = [
  "MoLSA",
  "MoE",
  "MoF",
  "MoH",
  "MoA",
  "MoT",
  "MoI",
  "MoD",
  "MoJ",
  "MoWIE",
  "other",
] as const;

const PHONE_NUMBER_PATTERN = /^(?:\+251|0)?9\d{8}$/;
const OTP_CODE_PATTERN = /^\d{6}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_BIRTH_YEAR = 1940;

export function normalizePhoneNumber(value: string): string {
  const compact = value.replace(/[\s()-]/g, "").trim();
  if (compact.startsWith("+251")) {
    return `0${compact.slice(4)}`;
  }
  return compact;
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (![year, month, day].every(Number.isInteger)) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function isBetweenAges(
  value: string,
  minimumAge: number,
  maximumAge: number,
): boolean {
  if (!isValidDateOnly(value)) {
    return false;
  }

  const birthDate = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  const age =
    today.getUTCFullYear() -
    birthDate.getUTCFullYear() -
    (today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate())
      ? 1
      : 0);

  return age >= minimumAge && age <= maximumAge;
}

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(10, "Enter a valid Ethiopian phone number")
  .max(20, "Enter a valid Ethiopian phone number")
  .refine((value) => PHONE_NUMBER_PATTERN.test(normalizePhoneNumber(value)), {
    message: "Enter a valid Ethiopian phone number",
  });

export const otpCodeSchema = z
  .string()
  .trim()
  .refine((value) => OTP_CODE_PATTERN.test(value), {
    message: "Enter the 6-digit OTP code",
  });

export const birthDateSchema = z
  .string()
  .trim()
  .refine((value) => isValidDateOnly(value), {
    message: "Enter a valid date in YYYY-MM-DD format",
  });

export const adultBirthDateSchema = birthDateSchema.refine(
  (value) => isBetweenAges(value, 18, 65),
  { message: "Users must be between 18 and 65 years old" },
);

export const faydaIdSchema = z
  .string()
  .trim()
  .min(6, "Fayda ID must be at least 6 characters")
  .max(32, "Fayda ID is too long")
  .refine((value) => /^[A-Za-z0-9-]+$/.test(value), {
    message: "Fayda ID contains invalid characters",
  });

export const jobCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Job title is required")
    .max(120, "Job title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Job description is required")
    .max(2000, "Job description is too long"),
  jobType: z.enum(JOB_TYPES),
  category: z.enum(JOB_CATEGORIES),
  tags: z.array(z.string().trim().min(1)).max(12).optional(),
  requirements: z.array(z.string().trim().min(1)).max(20).optional(),
  price: z.number().int().min(150, "Minimum budget is 150 ETB"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().trim().min(2, "Location address is required"),
  }),
  isRemote: z.boolean().optional(),
  urgency: z.enum(JOB_URGENCIES).optional(),
  scheduledAt: z.string().trim().optional(),
  durationDays: z.number().int().positive().optional(),
  workerCount: z.number().int().min(1).max(5000).optional(),
  aiGenerated: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  externalRef: z.string().trim().min(1).max(120).optional(),
});

export const bulkJobCreateSchema = z.object({
  jobs: z.array(jobCreateSchema).min(1).max(50),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120).optional(),
  skills: z.array(z.string().trim().min(1)).max(50).optional(),
  hourlyRate: z.number().int().positive().max(1000000).optional(),
  isAvailable: z.boolean().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().trim().min(2),
    })
    .optional(),
  cvUrl: z.string().url().optional(),
  birthDate: adultBirthDateSchema.optional(),
  employerType: z.enum(EMPLOYER_TYPES).optional(),
  orgName: z.string().trim().min(2).max(120).optional(),
  orgLicense: z.string().trim().min(2).max(120).optional(),
  massHireQuota: z.number().int().min(1).max(5000).optional(),
  ministryCode: z.enum(MINISTRY_CODES).optional(),
});

export const otpSendSchema = z.object({
  phone: phoneNumberSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneNumberSchema,
  code: otpCodeSchema,
  role: z.enum(AUTH_ROLES),
  name: z.string().trim().min(2).max(120).optional(),
});

export const registerWorkerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneNumberSchema,
  faydaId: faydaIdSchema,
  skills: z.array(z.string().trim().min(1)).min(1, "Select at least one skill"),
});
