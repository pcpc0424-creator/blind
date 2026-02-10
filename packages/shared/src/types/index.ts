// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User Types
export interface UserPublic {
  id: string;
  nickname: string;
  companyVerified: boolean;
  createdAt: string;
}

export interface UserProfile extends UserPublic {
  company: CompanyBasic;
  postCount: number;
  commentCount: number;
  totalVotesReceived: number;
}

export interface CurrentUser extends UserProfile {
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  lastActiveAt: string | null;
}

// Company Types
export interface CompanyBasic {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
}

export interface CompanyDetail extends CompanyBasic {
  industry: string | null;
  size: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE' | null;
  description: string | null;
  website: string | null;
  avgRating: number | null;
  totalReviews: number;
  avgSalary: number | null;
  avgWorkLife: number | null;
  avgCulture: number | null;
  avgManagement: number | null;
}

// Community Types
export interface CommunityBasic {
  id: string;
  name: string;
  slug: string;
  type: 'COMPANY' | 'INDUSTRY' | 'JOB' | 'GENERAL' | 'REGIONAL';
  iconUrl: string | null;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
}

export interface CommunityDetail extends CommunityBasic {
  description: string | null;
  bannerUrl: string | null;
  company: CompanyBasic | null;
  isMember: boolean;
}

// Post Types
export interface PostBasic {
  id: string;
  title: string;
  content: string;
  contentHtml: string | null;
  isAnonymous: boolean;
  viewCount: number;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary extends PostBasic {
  author: AuthorInfo;
  community: CommunityBasic;
  tags: TagBasic[];
  hasMedia: boolean;
  myVote: number | null; // 1, -1, or null
  isBookmarked: boolean;
}

export interface PostDetail extends PostSummary {
  media: PostMedia[];
  isPinned: boolean;
  isLocked: boolean;
}

export interface AuthorInfo {
  id: string;
  nickname: string;
  isAnonymous: boolean;
  company: string | null; // Company name if revealed
}

export interface PostMedia {
  id: string;
  type: 'IMAGE' | 'LINK';
  url: string;
  caption: string | null;
  order: number;
}

export interface TagBasic {
  id: string;
  name: string;
  slug: string;
}

// Comment Types
export interface CommentBasic {
  id: string;
  content: string;
  contentHtml: string | null;
  isAnonymous: boolean;
  isAuthor: boolean; // Is comment author same as post author
  voteCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDetail extends CommentBasic {
  author: AuthorInfo;
  parentId: string | null;
  myVote: number | null;
  replies?: CommentDetail[];
}

// Message Types
export interface Conversation {
  partnerId: string;
  partnerNickname: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageDetail {
  id: string;
  senderId: string;
  senderNickname: string;
  content: string;
  isRead: boolean;
  contextPostId: string | null;
  createdAt: string;
}

// Notification Types
export interface NotificationDetail {
  id: string;
  type: 'COMMENT' | 'REPLY' | 'VOTE' | 'MENTION' | 'MESSAGE' | 'SYSTEM';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// Report Types
export interface ReportDetail {
  id: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  post?: PostBasic;
  comment?: CommentBasic;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  expiresAt: string;
}

export interface VerificationResult {
  tempToken: string;
  expiresAt: string;
  company: CompanyBasic;
}

export interface RegisterResult {
  user: CurrentUser;
  tokens: AuthTokens;
}
