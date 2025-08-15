// Type definitions for InsightIQ AI API

// Base types
export interface WorkPlatformAttribute {
  id: string;
  name: string;
  logo_url: string;
}

// Common enums
export enum JobStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL'
}

export enum CommentType {
  RELEVANT_COMMENTS = 'RELEVANT_COMMENTS',
  IRRELEVANT_COMMENTS = 'IRRELEVANT_COMMENTS'
}

export enum ContentFormat {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  OTHER = 'OTHER'
}

export enum ContentType {
  REELS = 'REELS',
  IGTV = 'IGTV',
  TWEET = 'TWEET'
}

// Comments Analytics Types
export interface CommentsAnalyticsRequest {
  work_platform_id: string;
  content_url: string;
  brand_profile_url: string;
}

export interface RelevanceReportObject {
  total_comment_count: number;
  engagement_relevance_score: number;
  postive_comment_count: number;
  negative_comment_count: number;
  neutral_comment_count: number;
  purchase_intent_comment_count: number;
}

export interface CommentsAnalyticsResponse {
  id: string;
  work_platform: WorkPlatformAttribute;
  content_url: string;
  brand_profile_url: string;
}

export interface CommentsAnalyticsInsights {
  id: string;
  status: JobStatus;
  work_platform: WorkPlatformAttribute;
  content_url: string;
  brand_profile_url: string;
  report_information: RelevanceReportObject;
}

export interface AnalyzedComment {
  work_platform: WorkPlatformAttribute;
  content_url: string;
  brand_profile_url: string;
  text: string;
  sentiment: Sentiment;
  relevance_score: number;
  type: string;
}

export interface CommentsStreamResponse {
  comments_analytics: {
    id: string;
  };
  data: AnalyzedComment[];
  metadata: {
    limit: number;
    offset: number;
  };
}

// Purchase Intent Types
export interface PurchaseIntentRequest {
  work_platform_id: string;
  profile_url: string;
}

export interface PurchaseIntentResponse {
  id: string;
  work_platform: WorkPlatformAttribute;
  profile_url: string;
}

export interface ContentInformationObject {
  content_url: string;
  status: 'SUCCESS' | 'FAILURE';
  comment_analytics_job_id: string;
}

export interface PurchaseIntentInsights {
  id: string;
  status: JobStatus;
  work_platform: WorkPlatformAttribute;
  profile_url: string;
  report_information: RelevanceReportObject;
  content_information: ContentInformationObject[];
}

export interface PurchaseIntentComment {
  work_platform: WorkPlatformAttribute;
  profile_url: string;
  content_url: string;
  text: string;
  sentiment: Sentiment;
  purchase_intent: boolean;
}

export interface PurchaseIntentCommentsResponse {
  content_comments_analytics: {
    id: string;
  };
  data: PurchaseIntentComment[];
  metadata: {
    limit: number;
    offset: number;
  };
}

// Social Listening Types
export interface AudioTrackInfo {
  title: string;
  id: string;
}

export interface SocialListeningRequest {
  work_platform_id: string;
  keyword?: string;
  hashtag?: string;
  mention?: string;
  items_limit?: number;
  audio_track_info?: AudioTrackInfo;
  from_date?: string;
  to_date?: string;
}

export interface SocialListeningResponse {
  id: string;
  work_platform: WorkPlatformAttribute;
  status: JobStatus;
  keyword?: string;
  hashtag?: string;
  mention?: string;
  items_limit?: number;
  audio_track_info?: AudioTrackInfo;
  from_date?: string;
  to_date?: string;
}

export interface ProfileInfo {
  platform_username: string;
  url: string;
  image_url: string;
}

export interface EngagementMetrics {
  like_count: number;
  comment_count: number;
  view_count: number;
  share_count: number;
}

export interface MentionsPublicContentResponse {
  platform_username: string;
  first_name: string;
  image_url: string;
  is_verified: boolean;
}

export interface SocialContent {
  work_platform: WorkPlatformAttribute;
  profile: ProfileInfo;
  engagement: EngagementMetrics;
  platform_content_id: string;
  title: string;
  format: ContentFormat;
  type: ContentType;
  url: string;
  media_urls: string[];
  media_url: string | null;
  thumbnail_url: string;
  duration: number | null;
  description: string;
  published_at: string;
  audio_track_info: AudioTrackInfo;
  mentions: MentionsPublicContentResponse[];
  hashtags: string[];
}

export interface SocialListeningInsights {
  data: SocialContent[];
  metadata: {
    offset: number;
    limit: number;
  };
}

// Webhook Types
export enum WebhookEvent {
  ACCOUNTS_CONNECTED = 'ACCOUNTS.CONNECTED',
  ACCOUNTS_DISCONNECTED = 'ACCOUNTS.DISCONNECTED',
  PROFILES_ADDED = 'PROFILES.ADDED',
  PROFILES_UPDATED = 'PROFILES.UPDATED',
  PROFILES_AUDIENCE_ADDED = 'PROFILES_AUDIENCE.ADDED',
  PROFILES_AUDIENCE_UPDATED = 'PROFILES_AUDIENCE.UPDATED',
  CONTENTS_ADDED = 'CONTENTS.ADDED',
  CONTENTS_UPDATED = 'CONTENTS.UPDATED',
  CONTENTS_COMMENTS_ADDED = 'CONTENTS_COMMENTS.ADDED',
  CONTENTS_COMMENTS_UPDATED = 'CONTENTS_COMMENTS.UPDATED',
  CONTENT_GROUPS_ADDED = 'CONTENT-GROUPS.ADDED',
  CONTENT_GROUPS_UPDATED = 'CONTENT-GROUPS.UPDATED',
  TRANSACTIONS_ADDED = 'TRANSACTIONS.ADDED',
  TRANSACTIONS_UPDATED = 'TRANSACTIONS.UPDATED',
  PAYOUTS_ADDED = 'PAYOUTS.ADDED',
  PAYOUTS_UPDATED = 'PAYOUTS.UPDATED',
  BALANCES_ADDED = 'BALANCES.ADDED',
  BALANCES_UPDATED = 'BALANCES.UPDATED',
  CONTENTS_PUBLISH_SUCCESS = 'CONTENTS.PUBLISH_SUCCESS',
  CONTENTS_PUBLISH_READY = 'CONTENTS.PUBLISH_READY',
  CONTENTS_PUBLISH_FAILURE = 'CONTENTS.PUBLISH_FAILURE',
  SESSION_EXPIRED = 'SESSION.EXPIRED',
  ACTIVITY_ARTISTS_ADDED = 'ACTIVITY-ARTISTS.ADDED',
  ACTIVITY_ARTISTS_UPDATED = 'ACTIVITY-ARTISTS.UPDATED',
  ACTIVITY_CONTENTS_ADDED = 'ACTIVITY-CONTENTS.ADDED',
  ACTIVITY_CONTENTS_UPDATED = 'ACTIVITY-CONTENTS.UPDATED'
}

export interface WebhookRequest {
  url: string;
  events: WebhookEvent[];
  name: string;
}

export interface WebhookResponse {
  url: string;
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  events: WebhookEvent[];
  name: string;
}

export interface WebhookUpdateRequest {
  url: string;
  events: WebhookEvent[];
  is_active?: boolean;
  name: string;
}

export interface WebhooksListResponse {
  data: WebhookResponse[];
  metadata: {
    offset: number;
    limit: number;
    from_date: string | null;
    to_date: string | null;
  };
}

// Client Configuration
export interface InsightIQConfig {
  username: string;
  password: string;
  baseUrl?: string;
  sandbox?: boolean;
}

// API Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Additional custom error types for better error handling
export class AnalysisFailedError extends APIError {
  constructor(jobId: string, details?: any) {
    super(`Analysis failed for job ${jobId}`, 422, details);
    this.name = 'AnalysisFailedError';
  }
}

export class AnalysisTimeoutError extends APIError {
  constructor(jobId: string, timeout: number, details?: any) {
    super(`Analysis timeout for job ${jobId} after ${timeout}ms`, 408, details);
    this.name = 'AnalysisTimeoutError';
  }
}

// Query Parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CommentsQueryParams extends PaginationParams {
  type: CommentType;
}

export interface SocialListeningQueryParams extends PaginationParams {
  from_date?: string;
  to_date?: string;
}