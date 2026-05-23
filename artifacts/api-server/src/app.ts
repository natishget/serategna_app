import express, { type Express, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { resolveApiKey } from "./middleware/auth.js";

const API_VERSION = "v1";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ["X-API-Version", "X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Stamp every response with API version
app.use((_req, res, next) => {
  res.setHeader("X-API-Version", API_VERSION);
  res.setHeader("X-Powered-By", "Serategna");
  next();
});

// Global rate limit — 200 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
}));

// Stricter OTP rate limit
app.use(["/api/auth/otp", "/api/v1/auth/otp"], rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many OTP requests, please wait" },
}));

// Resolve API keys before route handlers (both paths)
app.use(["/api", "/api/v1"], resolveApiKey);

// Mount router at both /api (legacy) and /api/v1 (versioned)
app.use("/api/v1", router);
app.use("/api", router);

app.use("/", (res: Response) => {
  res.json({message: "Hello"})
})

// 404 & error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
