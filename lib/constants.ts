/**
 * InsightIQ Integration Constants
 * Centralized configuration for verification levels, milestones, and thresholds
 */

// Verification Level Thresholds
export const VERIFICATION_THRESHOLDS = {
  ELITE: {
    followers: 100000,
    authenticity: 85,
    influence: 80,
    qualityScore: 90
  },
  PREMIUM: {
    followers: 10000,
    authenticity: 75,
    influence: 70,
    qualityScore: 80
  },
  VERIFIED: {
    followers: 1000,
    authenticity: 65,
    influence: 60,
    qualityScore: 70
  }
} as const

// Token Creation Eligibility Requirements
export const TOKEN_CREATION_REQUIREMENTS = {
  minFollowers: 100,
  minAuthenticity: 50,
  minQualityScore: 60
} as const

// Milestone Thresholds
export const MILESTONE_THRESHOLDS = {
  followers: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000],
  engagement: [2, 4, 6, 8, 10, 15, 20],
  reach: [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000]
} as const

// Milestone Configurations
export const MILESTONE_CONFIGS = {
  follower: [
    { threshold: 1000, reward: 1 },
    { threshold: 5000, reward: 2 },
    { threshold: 10000, reward: 3 },
    { threshold: 25000, reward: 5 },
    { threshold: 50000, reward: 8 },
    { threshold: 100000, reward: 12 }
  ],
  engagement: [
    { threshold: 3, reward: 1 },
    { threshold: 5, reward: 2 },
    { threshold: 8, reward: 3 },
    { threshold: 12, reward: 5 }
  ],
  reach: [
    { threshold: 100000, reward: 2 },
    { threshold: 500000, reward: 4 },
    { threshold: 1000000, reward: 6 },
    { threshold: 5000000, reward: 10 }
  ]
} as const

// Token Metrics Configuration
export const TOKEN_METRICS = {
  names: [
    "followers",
    "engagement_rate",
    "reach",
    "influence_score",
    "authenticity_score",
    "growth_rate"
  ],
  thresholds: {
    engagement: [3, 5, 8, 12],
    influence: [60, 70, 80, 90],
    authenticity: [70, 80, 90, 95],
    growthRate: [5, 10, 15, 25]
  },
  rewards: {
    engagement: [1, 2, 3, 5],
    influence: [2, 3, 5, 8],
    authenticity: [1, 2, 4, 6],
    growthRate: [1, 2, 3, 5]
  }
} as const

// API Configuration
export const API_CONFIG = {
  defaultTimeout: 2000, // milliseconds
  maxRetries: 3,
  jwtExpiration: "7d"
} as const

// Verification Levels Type
export type VerificationLevel = 'basic' | 'verified' | 'premium' | 'elite'