import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  type JobData,
  type WorkerProfile,
  type JobCategory,
  type JobType,
} from "@/lib/api";
import { useAuth } from "./AuthContext";

export type { JobCategory, JobType } from "@/lib/api";

export type JobStatus =
  | "requested"
  | "matched"
  | "funded"
  | "active"
  | "completed"
  | "rated"
  | "cancelled";

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  workerId?: string;
  workerName?: string;
  title: string;
  description: string;
  jobType?: JobType;
  category: JobCategory;
  tags?: string[];
  requirements?: string[];
  status: JobStatus;
  price: number;
  workerCount?: number;
  workersFilled?: number;
  isRemote?: boolean;
  urgency?: "flexible" | "normal" | "urgent";
  location: { lat: number; lng: number; address: string };
  distance?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  rating?: number;
  escrowStatus?: "pending" | "locked" | "released" | "disputed" | "refunded";
}

export interface Worker {
  id: string;
  name: string;
  trustScore: number;
  rating: number;
  completedJobs: number;
  skills: string[];
  distance: number;
  location: { lat: number; lng: number; address: string };
  isAvailable: boolean;
  hourlyRate: number;
  verified?: boolean;
}

interface JobContextType {
  jobs: Job[];
  activeJob: Job | null;
  nearbyWorkers: Worker[];
  createJob: (
    job: Omit<
      Job,
      "id" | "status" | "createdAt" | "employerId" | "employerName"
    >,
  ) => Promise<Job>;
  acceptJob: (jobId: string, workerId: string) => Promise<void>;
  fundEscrow: (jobId: string, method: "telebirr" | "cbe") => Promise<void>;
  startJob: (jobId: string) => Promise<void>;
  completeJob: (jobId: string) => Promise<void>;
  rateJob: (jobId: string, rating: number, feedback: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  findWorkers: (
    category: JobCategory,
    location: { lat: number; lng: number },
  ) => Promise<Worker[]>;
}

const MOCK_JOBS: Job[] = [
  {
    id: "j-001",
    employerId: "e-001",
    employerName: "Tigist Alemu",
    workerId: "w-001",
    workerName: "Abebe Kebede",
    title: "Fix kitchen plumbing leak",
    description: "Need urgent plumbing repair in kitchen sink.",
    category: "plumbing",
    status: "active",
    price: 800,
    location: { lat: 9.0305, lng: 38.7498, address: "Kazanchis, Addis Ababa" },
    distance: 1.2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    escrowStatus: "locked",
  },
  {
    id: "j-002",
    employerId: "e-002",
    employerName: "Solomon Tesfaye",
    title: "House deep cleaning",
    description: "4 bedroom house needs thorough cleaning.",
    category: "cleaning",
    status: "requested",
    price: 600,
    location: { lat: 9.0245, lng: 38.7568, address: "Bole, Addis Ababa" },
    distance: 2.4,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    escrowStatus: "pending",
  },
  {
    id: "j-003",
    employerId: "e-003",
    employerName: "Marta Girma",
    title: "Electrical wiring installation",
    description: "Install wiring in new office space.",
    category: "electrical",
    status: "matched",
    price: 1500,
    location: { lat: 9.0145, lng: 38.7448, address: "Piassa, Addis Ababa" },
    distance: 3.1,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    escrowStatus: "pending",
  },
];

const MOCK_WORKERS: Worker[] = [
  {
    id: "w-001",
    name: "Abebe Kebede",
    trustScore: 847,
    rating: 4.8,
    completedJobs: 142,
    skills: ["Plumbing", "Construction"],
    distance: 0.8,
    location: { lat: 9.0235, lng: 38.7458, address: "Bole" },
    isAvailable: true,
    hourlyRate: 120,
  },
  {
    id: "w-002",
    name: "Haile Girma",
    trustScore: 792,
    rating: 4.6,
    completedJobs: 98,
    skills: ["Plumbing", "Electrical"],
    distance: 1.3,
    location: { lat: 9.0265, lng: 38.7488, address: "Gerji" },
    isAvailable: true,
    hourlyRate: 100,
  },
  {
    id: "w-003",
    name: "Selam Tesfaye",
    trustScore: 921,
    rating: 4.9,
    completedJobs: 203,
    skills: ["Cleaning", "Cooking"],
    distance: 2.0,
    location: { lat: 9.0195, lng: 38.7528, address: "Megenagna" },
    isAvailable: true,
    hourlyRate: 90,
  },
];

function toJob(d: JobData): Job {
  return {
    id: d.id,
    employerId: d.employerId,
    employerName: d.employerName,
    workerId: d.workerId,
    workerName: d.workerName,
    title: d.title,
    description: d.description,
    jobType: d.jobType,
    category: d.category as JobCategory,
    tags: d.tags,
    requirements: d.requirements,
    status: d.status as JobStatus,
    price: d.price,
    workerCount: d.workerCount,
    workersFilled: d.workersFilled,
    isRemote: d.isRemote,
    urgency: d.urgency,
    location: d.location,
    createdAt: d.createdAt,
    startedAt: d.startedAt,
    completedAt: d.completedAt,
    escrowStatus: d.escrowStatus as Job["escrowStatus"],
  };
}

function toWorker(w: WorkerProfile, index: number): Worker {
  return {
    id: w.id,
    name: w.name,
    trustScore: w.trustScore,
    rating: w.rating,
    completedJobs: w.completedJobs,
    skills: w.skills,
    distance: (index + 1) * 0.8,
    location: w.location ?? {
      lat: 9.0245,
      lng: 38.7468,
      address: "Addis Ababa",
    },
    isAvailable: w.isAvailable,
    hourlyRate: w.estimatedDailyRate,
  };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [nearbyWorkers, setNearbyWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setJobs([]);
      setActiveJob(null);
      setNearbyWorkers([]);
      return;
    }

    const active = jobs.find((j) => j.status === "active") || null;
    setActiveJob(active);
  }, [jobs, isAuthenticated]);

  const refreshJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { jobs: data } = await api.getJobs();
      setJobs(data.map(toJob));
    } catch {
      // Offline fallback — keep current state
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refreshJobs();
    else {
      setJobs([]);
      setNearbyWorkers([]);
      setActiveJob(null);
    }
  }, [isAuthenticated, refreshJobs]);

  const createJob = useCallback(
    async (
      jobData: Omit<
        Job,
        "id" | "status" | "createdAt" | "employerId" | "employerName"
      >,
    ): Promise<Job> => {
      try {
        const { job: created } = await api.createJob({
          title: jobData.title,
          description: jobData.description,
          jobType: jobData.jobType,
          category: jobData.category,
          tags: jobData.tags,
          requirements: jobData.requirements,
          price: jobData.price,
          location: jobData.location,
          isRemote: jobData.isRemote,
          urgency: jobData.urgency,
          workerCount: jobData.workerCount,
        });
        const newJob = toJob(created);
        setJobs((prev) => [newJob, ...prev]);
        return newJob;
      } catch {
        // Offline fallback
        const newJob: Job = {
          ...jobData,
          id: `j-${Date.now()}`,
          employerId: "e-001",
          employerName: "You",
          status: "requested",
          createdAt: new Date().toISOString(),
          escrowStatus: "pending",
        };
        setJobs((prev) => [newJob, ...prev]);
        return newJob;
      }
    },
    [],
  );

  const acceptJob = useCallback(async (jobId: string, workerId: string) => {
    try {
      const { job: updated } = await api.acceptJob(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? toJob(updated) : j)));
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: "matched" as JobStatus, workerId }
            : j,
        ),
      );
    }
  }, []);

  const fundEscrow = useCallback(
    async (jobId: string, method: "telebirr" | "cbe") => {
      try {
        const { job: updated } = await api.fundEscrow(jobId, method);
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? toJob(updated) : j)),
        );
      } catch {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: "funded" as JobStatus, escrowStatus: "locked" }
              : j,
          ),
        );
      }
    },
    [],
  );

  const startJob = useCallback(async (jobId: string) => {
    try {
      const { job: updated } = await api.startJob(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? toJob(updated) : j)));
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "active" as JobStatus,
                startedAt: new Date().toISOString(),
              }
            : j,
        ),
      );
    }
  }, []);

  const completeJob = useCallback(async (jobId: string) => {
    try {
      const { job: updated } = await api.completeJob(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? toJob(updated) : j)));
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "completed" as JobStatus,
                completedAt: new Date().toISOString(),
                escrowStatus: "released",
              }
            : j,
        ),
      );
    }
  }, []);

  const rateJob = useCallback(
    async (jobId: string, rating: number, feedback: string) => {
      try {
        const { job: updated } = await api.rateJob(jobId, rating, feedback);
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? toJob(updated) : j)),
        );
      } catch {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: "rated" as JobStatus, rating } : j,
          ),
        );
      }
    },
    [],
  );

  const findWorkers = useCallback(
    async (
      category: JobCategory,
      _location: { lat: number; lng: number },
    ): Promise<Worker[]> => {
      try {
        const { workers } = await api.getWorkers({ category });
        const mapped = workers.map(toWorker);
        setNearbyWorkers(mapped);
        return mapped;
      } catch {
        const fallback = MOCK_WORKERS.filter((w) => w.isAvailable).slice(0, 3);
        setNearbyWorkers(fallback);
        return fallback;
      }
    },
    [],
  );

  return (
    <JobContext.Provider
      value={{
        jobs,
        activeJob,
        nearbyWorkers,
        createJob,
        acceptJob,
        fundEscrow,
        startJob,
        completeJob,
        rateJob,
        refreshJobs,
        findWorkers,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error("useJobs must be used within JobProvider");
  return ctx;
}
