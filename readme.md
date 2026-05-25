# Serategna Application — Functional & Business Architecture Guide

## Overview

Serategna is a digital labor marketplace and workforce management platform designed for Ethiopia. The platform modernizes informal labor hiring by connecting workers, employers, and agents through a structured, trusted, and state-driven ecosystem.

The application transforms traditional labor brokerage into a digital platform with:

- verified user accounts,
- structured job workflows,
- escrow-based payment protection,
- trust scoring,
- workforce coordination,
- dispute resolution,
- and formalized labor management.

The system is NOT a simple freelance platform. It is a multi-role labor execution ecosystem.

---

# Core User Roles

The platform contains four primary user roles:

## 1. Worker

Workers are labor providers who:

- create profiles,
- define skills,
- browse jobs,
- accept jobs,
- complete work,
- receive payments,
- build reputation through ratings and trust scores.

Workers may belong to:

- technical trades,
- logistics,
- construction,
- cleaning,
- manufacturing,
- healthcare,
- IT,
- administration,
- hospitality,
- agriculture,
- and many other labor categories.

---

## 2. Employer

Employers are individuals or organizations that:

- post jobs,
- define requirements,
- fund escrow,
- manage workers,
- monitor job progress,
- approve job completion,
- rate workers,
- and open disputes if necessary.

Employers may be:

- individuals,
- businesses,
- NGOs,
- enterprises,
- or government organizations.

---

## 3. Agent

Agents are workforce coordinators who act as digital labor managers.

Agents:

- onboard workers,
- create worker profiles,
- upload worker documents,
- manage worker pools,
- coordinate mass hires,
- monitor worker attendance,
- and earn commission from completed jobs.

Agents are the modernized version of traditional labor brokers (“Delala”).

---

## 4. Administrator

Administrators manage and moderate the entire platform.

Admins:

- verify users,
- review documents,
- monitor activity,
- handle disputes,
- suspend accounts,
- review suspicious behavior,
- and oversee system operations.

---

# Application Philosophy

The platform must follow these core principles:

## 1. Trust-Driven System

Every user has a reputation and trust score.

Trust is built through:

- successful job completion,
- ratings,
- responsiveness,
- reliability,
- punctuality,
- dispute history,
- and platform activity.

Trust scores affect:

- visibility,
- matching priority,
- credibility,
- and future opportunities.

---

## 2. State-Driven Architecture

The entire system is based on workflow states.

Every job moves through predefined stages.

The platform must enforce these transitions strictly.

Primary job states:

- Requested
- Matched
- Funded
- Active
- Completed
- Disputed
- Cancelled

No state should be skipped illegally.

Backend logic must validate all transitions.

---

## 3. Escrow-First Execution

A job cannot begin before employer funding is secured.

The platform operates using an escrow model where:

- employers fund jobs,
- funds remain locked,
- workers complete work,
- payment is released only after approval or resolution.

The system must prevent:

- unpaid labor,
- premature payment release,
- invalid completion,
- and escrow bypassing.

---

# Worker Functional Requirements

## Worker Registration

Workers can:

- register accounts,
- verify phone numbers using OTP,
- create profiles,
- upload identity documents,
- define skills,
- define rates,
- define availability,
- upload certifications.

Workers remain in a pending verification state until approved.

---

## Worker Profile System

Worker profiles must include:

- profile image,
- full name,
- skill categories,
- work experience,
- certifications,
- rates,
- trust score,
- completed jobs,
- ratings,
- and profile status.

Profiles must be editable.

---

## Worker Categories

Workers can belong to categories such as:

- Plumbing
- Electrical
- Construction
- Carpentry
- Welding
- Painting
- Tailoring
- Manufacturing
- Cleaning
- Cooking
- Gardening
- Moving
- Delivery
- Logistics
- Security
- Healthcare
- Childcare
- IT / Tech
- Finance / Admin
- Education
- Hospitality
- Agriculture
- and others.

Categories must be configurable and extensible.

---

## Worker Job Discovery

Workers can:

- browse available jobs,
- filter by category,
- filter by payment type,
- filter by job type,
- filter by duration,
- and review job details.

---

## Worker Job Acceptance

Workers can:

- accept jobs,
- reject jobs,
- confirm availability,
- view job requirements,
- and track job status.

---

## Worker Ratings & Trust Score

Workers receive:

- ratings,
- reviews,
- repeat hire indicators,
- and trust score updates.

Trust score calculations should consider:

- completion rate,
- employer ratings,
- dispute history,
- responsiveness,
- cancellations,
- and reliability.

---

# Employer Functional Requirements

## Employer Registration

Employers can:

- create individual accounts,
- create business accounts,
- upload business licenses,
- manage organization details,
- and verify identity.

---

## Job Posting

Employers can create jobs with:

- title,
- description,
- category,
- payment amount,
- duration,
- requirements,
- worker quantity,
- and job type.

Supported job types:

- Gig
- Informal
- Formal
- Contract
- Seasonal
- Emergency
- Mass Hire
- Internship
- Remote

---

## Employer Job Management

Employers can:

- monitor jobs,
- manage workers,
- review statuses,
- approve completion,
- cancel jobs,
- and manage disputes.

---

## Employer Dashboard

The employer dashboard should include:

- active jobs,
- completed jobs,
- escrow information,
- worker lists,
- payment history,
- analytics,
- and trust score information.

---

## Employer Ratings

Employers can rate workers after completion.

Workers can also rate employers.

Employer trust scores should be based on:

- payment reliability,
- dispute history,
- completion behavior,
- and worker feedback.

---

# Agent Functional Requirements

## Agent Registration

Agents can:

- register accounts,
- upload identity documents,
- manage worker pools,
- and become verified coordinators.

---

## Worker Management by Agents

Agents can:

- register workers manually,
- create worker profiles,
- upload worker documents,
- assign worker categories,
- and manage worker availability.

---

## Workforce Coordination

Agents can:

- manage multiple workers,
- coordinate mass hires,
- monitor attendance,
- track worker statuses,
- and communicate with employers.

---

## Agent Commission System

Agents receive commissions from successful jobs.

The commission engine must:

- calculate commissions automatically,
- record commission transactions,
- and display commission history.

---

# Job Management System

## Job Types

The platform supports:

- Gig jobs
- Informal jobs
- Formal jobs
- Contract jobs
- Seasonal jobs
- Emergency jobs
- Mass hire jobs
- Internship jobs
- Remote jobs

Each job type may have:

- different durations,
- payment schedules,
- workflow rules,
- and validation logic.

---

## Job Status Workflow

Every job follows lifecycle states:

- Requested
- Matched
- Funded
- Active
- Completed
- Disputed
- Cancelled

State changes must be validated in backend services.

---

## QR Attendance System

The system supports attendance management using QR codes.

Features:

- QR generation,
- worker QR scanning,
- clock-in recording,
- clock-out recording,
- and attendance tracking.

---

## Evidence Submission

Users can upload:

- photos,
- completion evidence,
- comments,
- and dispute evidence.

Uploads must be securely stored.

---

# Escrow & Payment Architecture

## Escrow System

The escrow system must:

- lock employer funds,
- prevent premature release,
- hold funds during disputes,
- and release payments only after approval.

Jobs cannot become active before escrow is funded.

---

## Smart Split Payment Engine

Payments are automatically partitioned.

The system supports:

- worker payment allocation,
- platform fee deduction,
- tax deduction,
- and agent commission deduction.

All transactions must be auditable.

---

## Transaction History

The platform stores:

- all transactions,
- escrow records,
- releases,
- commissions,
- refunds,
- and receipts.

Users can view transaction history.

---

# Communication System

## Job-Based Chat

Communication should remain job-specific.

The platform should support:

- private job chats,
- group job chats,
- message history,
- and job-related communication only.

Communication should remain linked to the related job context.

---

## Notifications

The system sends notifications for:

- new jobs,
- job acceptance,
- escrow updates,
- payment updates,
- disputes,
- ratings,
- and workflow changes.

---

# Dispute Resolution System

## Dispute Creation

Workers and employers can:

- open disputes,
- upload evidence,
- provide notes,
- and request review.

---

## Arbitration System

Admins/moderators can:

- review evidence,
- evaluate claims,
- and issue resolutions.

---

## Supported Resolution Types

The system supports:

- full refund,
- partial refund,
- redo work,
- and payment release.

---

# Financial Inclusion Features

## Labor Credit Score

The platform generates labor trust/credit scores based on:

- work history,
- reputation,
- completion quality,
- and payment reliability.

---

## Loan & Financial Features

The platform may later support:

- worker loan eligibility,
- employer financing,
- and financial product integrations.

These features should remain modular and optional.

---

# Analytics & Intelligence

The platform should provide:

- labor demand analytics,
- market rate insights,
- category statistics,
- worker performance analytics,
- employer analytics,
- and workforce reporting.

---

# Admin System

## User Administration

Admins can:

- manage users,
- suspend accounts,
- verify documents,
- and review platform activity.

---

## Job Administration

Admins can:

- monitor jobs,
- monitor disputes,
- review suspicious activity,
- and audit workflow integrity.

---

## Analytics Dashboard

Admins should access:

- platform statistics,
- revenue reports,
- labor insights,
- and operational analytics.

---

# Security Requirements

## Role-Based Access Control

The system must enforce strict RBAC.

Each role has separate permissions.

Unauthorized actions must be blocked at:

- API level,
- service level,
- and frontend level.

---

## Data Protection

Sensitive information must be protected.

The system must:

- encrypt sensitive data,
- secure authentication,
- secure payment records,
- and secure uploaded documents.

---

## Audit Logging

Critical activities must be logged:

- authentication events,
- payment events,
- dispute actions,
- role changes,
- and moderation actions.

Audit logs should be immutable and traceable.

---

# Technical Architecture Expectations

The codebase should follow:

## Backend

- modular architecture,
- service-based business logic,
- controller/service/repository separation,
- strong validation,
- typed APIs,
- reusable middleware,
- and transaction-safe database operations.

---

## Frontend / Mobile

- reusable UI components,
- role-based navigation,
- centralized API layer,
- scalable folder structure,
- typed models,
- and maintainable state management.

---

# Important Constraints

DO NOT implement:

- AI-generated CV features,
- AI recommendations,
- AI pricing systems,
- GPS tracking,
- emergency alert systems,
- police integrations,
- live location monitoring,
- geolocation-based worker matching.

These are intentionally excluded from the current implementation scope.

The current implementation focus is:

- stable architecture,
- scalable workflows,
- escrow logic,
- role management,
- workforce coordination,
- trust systems,
- dispute management,
- and production-quality infrastructure.

---

# Final Development Direction

Serategna must be treated as:

- a scalable labor management platform,
- not a simple freelance app,
- not a simple CRUD application,
- and not a prototype-only MVP.

Every implementation should prioritize:

- scalability,
- maintainability,
- security,
- modularity,
- clean architecture,
- and production readiness.
