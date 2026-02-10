// Adjectives for nickname generation
const ADJECTIVES = [
  'brave', 'calm', 'clever', 'cool', 'curious', 'eager', 'fast', 'fierce',
  'gentle', 'happy', 'honest', 'kind', 'lazy', 'lucky', 'mighty', 'noble',
  'proud', 'quick', 'quiet', 'sharp', 'shy', 'silent', 'smart', 'smooth',
  'soft', 'swift', 'tall', 'tiny', 'warm', 'wild', 'wise', 'witty',
  'bright', 'bold', 'golden', 'silver', 'cosmic', 'mystic', 'epic', 'royal',
];

// Nouns for nickname generation
const NOUNS = [
  'bear', 'bird', 'cat', 'deer', 'dog', 'eagle', 'falcon', 'fox',
  'hawk', 'horse', 'lion', 'owl', 'panda', 'rabbit', 'raven', 'shark',
  'tiger', 'whale', 'wolf', 'zebra', 'dragon', 'phoenix', 'unicorn', 'griffin',
  'koala', 'dolphin', 'penguin', 'turtle', 'otter', 'beaver', 'lynx', 'cobra',
];

/**
 * Generate an anonymous nickname in the format: adjective_noun_4digits
 * Example: swift_fox_8472
 */
export function generateNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number

  return `${adjective}_${noun}_${number}`;
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }
  return parts[1];
}

/**
 * Format a number for display (e.g., 1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Create a slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Constants for the application
 */
export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  // Content limits
  MAX_POST_TITLE_LENGTH: 100,
  MAX_POST_CONTENT_LENGTH: 10000,
  MAX_COMMENT_LENGTH: 2000,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_TAGS_PER_POST: 5,
  MAX_IMAGES_PER_POST: 10,

  // Auth
  VERIFICATION_CODE_EXPIRY_MINUTES: 10,
  TEMP_TOKEN_EXPIRY_MINUTES: 30,
  SESSION_EXPIRY_DAYS: 7,

  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  MAX_VERIFICATION_ATTEMPTS: 3,

  // Trending
  TRENDING_HOURS: 24,
  MIN_VOTES_FOR_TRENDING: 5,
} as const;

/**
 * Error codes for the API
 */
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'AUTH_001',
  EMAIL_NOT_VERIFIED: 'AUTH_002',
  INVALID_VERIFICATION_CODE: 'AUTH_003',
  VERIFICATION_CODE_EXPIRED: 'AUTH_004',
  EMAIL_ALREADY_REGISTERED: 'AUTH_005',
  INVALID_TEMP_TOKEN: 'AUTH_006',
  SESSION_EXPIRED: 'AUTH_007',
  UNAUTHORIZED: 'AUTH_008',

  // Company
  COMPANY_NOT_FOUND: 'COMPANY_001',
  INVALID_COMPANY_DOMAIN: 'COMPANY_002',

  // Community
  COMMUNITY_NOT_FOUND: 'COMMUNITY_001',
  NOT_COMMUNITY_MEMBER: 'COMMUNITY_002',
  ALREADY_COMMUNITY_MEMBER: 'COMMUNITY_003',
  COMPANY_VERIFICATION_REQUIRED: 'COMMUNITY_004',

  // Post
  POST_NOT_FOUND: 'POST_001',
  POST_DELETED: 'POST_002',
  POST_LOCKED: 'POST_003',
  NOT_POST_AUTHOR: 'POST_004',

  // Comment
  COMMENT_NOT_FOUND: 'COMMENT_001',
  COMMENT_DELETED: 'COMMENT_002',
  NOT_COMMENT_AUTHOR: 'COMMENT_003',
  INVALID_PARENT_COMMENT: 'COMMENT_004',

  // General
  VALIDATION_ERROR: 'VALIDATION_001',
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  INTERNAL_ERROR: 'INTERNAL_001',
  NOT_FOUND: 'NOT_FOUND_001',
  FORBIDDEN: 'FORBIDDEN_001',
  SERVICE_UNAVAILABLE: 'SERVICE_001',

  // Settings
  REGISTRATION_DISABLED: 'SETTINGS_001',
  DAILY_POST_LIMIT_EXCEEDED: 'SETTINGS_002',
  DAILY_COMMENT_LIMIT_EXCEEDED: 'SETTINGS_003',
} as const;
