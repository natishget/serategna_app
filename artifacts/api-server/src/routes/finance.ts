import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// ─── Credit Scoring Algorithm ──────────────────────────────────────────────────
function calculateCreditScore(user: typeof users.$inferSelect): {
  score: number;
  grade: string;
  factors: Record<string, number>;
  breakdown: string[];
} {
  let score = 0;
  const factors: Record<string, number> = {};
  const breakdown: string[] = [];

  // Trust Score (40% weight) - Main reputation factor
  const trustScore = user.trustScore;
  const trustPoints = Math.min(trustScore / 10, 40); // Max 40 points
  factors.trust = trustPoints;
  score += trustPoints;
  breakdown.push(`Trust Score: ${trustScore} (${trustPoints.toFixed(1)} pts)`);

  // Completed Jobs (20% weight) - Experience factor
  const jobsCompleted = user.completedJobs;
  const jobPoints = Math.min(jobsCompleted * 2, 20); // Max 20 points
  factors.jobs = jobPoints;
  score += jobPoints;
  breakdown.push(`Jobs Completed: ${jobsCompleted} (${jobPoints.toFixed(1)} pts)`);

  // Rating (15% weight) - Quality factor
  const rating = user.ratingCount > 0 ? Math.round((user.ratingSum / user.ratingCount) * 10) / 10 : 0;
  const ratingPoints = rating * 1.5; // Max 15 points
  factors.rating = ratingPoints;
  score += ratingPoints;
  breakdown.push(`Average Rating: ${rating}★ (${ratingPoints.toFixed(1)} pts)`);

  // Wallet Balance (10% weight) - Financial stability
  const balance = user.walletBalance;
  const balancePoints = Math.min(balance / 1000, 10); // Max 10 points for 10k+ balance
  factors.balance = balancePoints;
  score += balancePoints;
  breakdown.push(`Wallet Balance: ${balance} ETB (${balancePoints.toFixed(1)} pts)`);

  // Skills/Certifications (10% weight) - Employability
  const skillCount = (user.skills ?? []).length;
  const skillPoints = Math.min(skillCount * 2, 10); // Max 10 points for 5+ skills
  factors.skills = skillPoints;
  score += skillPoints;
  breakdown.push(`Skills/Certifications: ${skillCount} (${skillPoints.toFixed(1)} pts)`);

  // Role Stability (5% weight) - Worker vs Employer
  const rolePoints = user.role === 'worker' ? 5 : user.role === 'employer' ? 3 : 1;
  factors.role = rolePoints;
  score += rolePoints;
  breakdown.push(`Role Stability: ${user.role} (${rolePoints.toFixed(1)} pts)`);

  // Determine credit grade
  let grade: string;
  if (score >= 85) grade = 'Excellent';
  else if (score >= 70) grade = 'Good';
  else if (score >= 55) grade = 'Fair';
  else if (score >= 40) grade = 'Poor';
  else grade = 'Very Poor';

  return { score: Math.round(score), grade, factors, breakdown };
}

const PRODUCTS = [
  { id: "cbe1", bank: "Commercial Bank of Ethiopia", bankShort: "CBE", type: "bank", product: "Salary-Linked Micro Loan", maxAmount: 50000, ratePercent: 12.5, termMonths: 12, minScore: 700, color: "#1976D2", features: ["No collateral required", "Same-day approval", "Auto-repay from wallet"] },
  { id: "weg1", bank: "Wegagen Bank", bankShort: "WB", type: "bank", product: "Skill Worker Credit Line", maxAmount: 30000, ratePercent: 14, termMonths: 6, minScore: 650, color: "#E91E63", features: ["Revolving credit line", "Trust Score as guarantee", "Mobile repayment"] },
  { id: "das1", bank: "Dashen Bank", bankShort: "DB", type: "bank", product: "Trade Finance Advance", maxAmount: 100000, ratePercent: 13, termMonths: 24, minScore: 800, color: "#FF6F00", features: ["For certified tradespeople", "Fayda-verified only", "Grace period available"] },
  { id: "awash1", bank: "Awash Bank", bankShort: "AB", type: "bank", product: "Worker Savings Loan", maxAmount: 20000, ratePercent: 11, termMonths: 6, minScore: 600, color: "#2E7D32", features: ["Savings-backed", "Build credit history", "Lowest rate tier"] },
  { id: "abyssinia1", bank: "Abyssinia Bank", bankShort: "BofA", type: "bank", product: "Gig Worker Advance", maxAmount: 15000, ratePercent: 15, termMonths: 3, minScore: 600, color: "#6A1B9A", features: ["Instant approval", "Advance on confirmed jobs"] },
  { id: "acsi1", bank: "ACSI Micro Finance", bankShort: "ACSI", type: "mfi", product: "Productive Sector Loan", maxAmount: 10000, ratePercent: 18, termMonths: 12, minScore: 500, color: "#00796B", features: ["Rural & urban workers", "Group guarantee option"] },
  { id: "ocssco1", bank: "Oromia Credit & Savings", bankShort: "OCSSCO", type: "mfi", product: "Self-Employment Loan", maxAmount: 8000, ratePercent: 16, termMonths: 12, minScore: 500, color: "#F57C00", features: ["Cooperative model", "Flexible repayment"] },
  { id: "ins1", bank: "Nyala Insurance", bankShort: "NIC", type: "insurance", product: "Worker Accident Cover", maxAmount: 200000, ratePercent: 2.5, termMonths: 12, minScore: 600, color: "#D32F2F", features: ["On-the-job accident cover", "Medical expense cover", "Fayda-linked policy"] },
  { id: "sav1", bank: "Lion International Bank", bankShort: "LIB", type: "savings", product: "Goal-Based Savings Account", maxAmount: 0, ratePercent: 7, termMonths: 0, minScore: 550, color: "#1565C0", features: ["Auto-save from wages", "No minimum balance"] },
];

// List financial products for the current user
router.get("/products", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const products = PRODUCTS.map(p => ({
      ...p,
      eligible: user.trustScore >= p.minScore,
    }));

    res.json({
      trustScore: user.trustScore,
      products,
      eligibleCount: products.filter(p => p.eligible).length,
    });
  } catch (err) { next(err); }
});

// Submit a loan application
router.post("/apply", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { productId, requestedAmount } = z.object({
      productId: z.string(),
      requestedAmount: z.number().int().min(1000),
    }).parse(req.body);

    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Calculate comprehensive credit score
    const creditAnalysis = calculateCreditScore(user);

    // Check eligibility based on credit score
    if (creditAnalysis.score < product.minScore) {
      res.status(403).json({
        error: `Credit Score ${product.minScore} required (yours: ${creditAnalysis.score})`,
        creditScore: creditAnalysis.score,
        grade: creditAnalysis.grade,
        breakdown: creditAnalysis.breakdown,
        factors: creditAnalysis.factors
      });
      return;
    }

    // Additional checks for high-value loans
    if (requestedAmount > 50000 && creditAnalysis.score < 70) {
      res.status(403).json({
        error: "High-value loans require Good credit (70+ score)",
        creditScore: creditAnalysis.score,
        grade: creditAnalysis.grade,
        requestedAmount,
        maxRecommended: 50000
      });
      return;
    }

    // In production: call bank API. For demo: return approval reference.
    const referenceId = `LOAN-${Date.now().toString().slice(-8)}`;
    res.json({
      success: true,
      referenceId,
      message: `Application submitted to ${product.bank}. Expect contact within 24 hours.`,
      product: product.product,
      requestedAmount,
      creditScore: creditAnalysis.score,
      grade: creditAnalysis.grade,
      breakdown: creditAnalysis.breakdown
    });
  } catch (err) { next(err); }
});

// Get user's credit score and analysis
router.get("/credit-score", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const creditAnalysis = calculateCreditScore(user);

    // Calculate loan eligibility for each product
    const eligibility = PRODUCTS.map(product => ({
      productId: product.id,
      product: product.product,
      bank: product.bank,
      eligible: creditAnalysis.score >= product.minScore,
      minScore: product.minScore,
      maxAmount: product.maxAmount,
      recommendedAmount: Math.min(product.maxAmount, creditAnalysis.score * 100) // Rough estimate
    }));

    res.json({
      creditScore: creditAnalysis.score,
      grade: creditAnalysis.grade,
      factors: creditAnalysis.factors,
      breakdown: creditAnalysis.breakdown,
      eligibility,
      recommendations: creditAnalysis.score < 55 ? [
        "Complete more jobs to build experience",
        "Maintain high ratings from employers",
        "Build up wallet balance",
        "Add skills and certifications"
      ] : []
    });
  } catch (err) { next(err); }
});

export default router;
