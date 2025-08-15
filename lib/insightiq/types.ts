// Base types and utilities
export type UUID = string;
export type ISO8601DateTime = string;
export type ISO8601Date = string;
export type URI = string;

// Base response metadata
export interface Metadata {
  offset: number;
  limit: number;
  from_date?: ISO8601Date | null;
  to_date?: ISO8601Date | null;
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Date range parameters
export interface DateRangeParams {
  from_date?: ISO8601Date;
  to_date?: ISO8601Date;
}

// Common attribute types
export interface UserAttribute {
  id: UUID;
  name: string;
}

export interface AccountAttribute {
  id: UUID;
  platform_username: string;
}

export interface WorkPlatformAttribute {
  id: UUID;
  name: string;
  logo_url: URI;
}

export interface ContentAttribute {
  id: UUID;
  url: URI;
  published_at: ISO8601DateTime;
}

// Enums
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum AccountStatus {
  CONNECTED = 'CONNECTED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  SESSION_EXPIRED = 'SESSION_EXPIRED'
}

export enum WorkPlatformCategory {
  MEDIA = 'MEDIA',
  EDUCATION = 'EDUCATION',
  SOCIAL = 'SOCIAL',
  ENTERTAINMENT = 'ENTERTAINMENT',
  LIFESTYLE = 'LIFESTYLE',
  BUSINESS = 'BUSINESS'
}

export enum WorkPlatformStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNSPECIFIED = 'UNSPECIFIED'
}

export enum ContentFormat {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  COLLECTION = 'COLLECTION',
  OTHER = 'OTHER'
}

export enum ContentType {
  VIDEO = 'VIDEO',
  POST = 'POST',
  STORY = 'STORY',
  TWEET = 'TWEET',
  BLOG = 'BLOG',
  IMAGE = 'IMAGE',
  THREAD = 'THREAD',
  PODCAST = 'PODCAST',
  TRACK = 'TRACK',
  OTHER = 'OTHER',
  REELS = 'REELS',
  STREAM = 'STREAM',
  FEED = 'FEED',
  IGTV = 'IGTV',
  RETWEET = 'RETWEET',
  QUOTE = 'QUOTE',
  REPLY = 'REPLY'
}

export enum ContentGroupType {
  ALBUM = 'ALBUM',
  PLAYLIST = 'PLAYLIST',
  OTHER = 'OTHER'
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export enum ActivityType {
  FOLLOWED = 'FOLLOWED',
  TOP = 'TOP',
  RECENT = 'RECENT',
  SAVED = 'SAVED'
}

export enum AudienceType {
  FREE = 'FREE',
  PAID = 'PAID',
  BOTH = 'BOTH'
}

export enum PlatformType {
  WEB = 'WEB',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH'
}

export enum ContactType {
  WORK = 'WORK',
  HOME = 'HOME',
  OTHER = 'OTHER'
}

export enum Products {
  IDENTITY = 'IDENTITY',
  IDENTITY_AUDIENCE = 'IDENTITY.AUDIENCE',
  ENGAGEMENT = 'ENGAGEMENT',
  ENGAGEMENT_AUDIENCE = 'ENGAGEMENT.AUDIENCE',
  INCOME = 'INCOME',
  PUBLISH_CONTENT = 'PUBLISH.CONTENT',
  ACTIVITY = 'ACTIVITY'
}

// Core entity interfaces

// User interfaces
export interface User {
  id: UUID;
  name: string;
  external_id: string;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  status: UserStatus;
}

export interface CreateUserRequest {
  name: string;
  external_id: string;
}

// Work Platform interfaces
export interface WorkPlatformProducts {
  identity: {
    is_supported: boolean;
    audience?: {
      is_supported: boolean;
    };
  };
  engagement: {
    is_supported: boolean;
    audience?: {
      is_supported: boolean;
    };
  };
  income: {
    is_supported: boolean;
  };
  activity: {
    is_supported: boolean;
  };
  publish: {
    is_supported: boolean;
  };
  switch: {
    is_supported: boolean;
  };
}

export interface WorkPlatform {
  id: UUID;
  name: string;
  logo_url: URI;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  category: WorkPlatformCategory;
  status: WorkPlatformStatus;
  url: URI;
  products: WorkPlatformProducts;
}

// Account interfaces
export interface AccountData {
  identity?: {
    status: string;
    last_sync_at: ISO8601DateTime;
    monitoring_type: string;
  };
  engagement?: {
    status: string;
    last_sync_at: ISO8601DateTime;
    refresh_since?: ISO8601DateTime | null;
    data_available_from?: ISO8601DateTime | null;
    monitoring_type: string;
    audience?: {
      status: string;
      last_sync_at: ISO8601DateTime;
      refresh_since?: ISO8601DateTime | null;
      data_available_from?: ISO8601DateTime | null;
      monitoring_type: string;
    };
  };
}

export interface Account {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  work_platform: WorkPlatformAttribute;
  platform_username?: string | null;
  profile_pic_url?: URI | null;
  status: AccountStatus;
  platform_profile_name: string;
  platform_profile_id: string;
  platform_profile_published_at?: ISO8601DateTime | null;
  data: AccountData;
}

// Token interfaces
export interface CreateSDKTokenRequest {
  user_id: UUID;
  products: Products[];
}

export interface SDKTokenResponse {
  sdk_token: string;
  expires_at: ISO8601DateTime;
}

// Link interfaces
export interface CreateLinkRequest {
  name?: string;
  external_id: string;
}

export interface LinkResponse {
  created_at: ISO8601DateTime;
  microsite_url: URI;
  invite_id: UUID;
  external_id: string;
}

// Profile interfaces
export interface Email {
  type: ContactType;
  email_id: string;
}

export interface PhoneNumber {
  type: ContactType;
  phone_number: string;
}

export interface Address {
  type: ContactType;
  address: string;
}

export interface TimePeriod {
  start_date?: ISO8601Date;
  end_date?: ISO8601Date;
}

export interface Company {
  name?: string;
  description?: string;
}

export interface School {
  name?: string;
  description?: string;
}

export interface WorkExperience {
  title: string;
  company: Company;
  description?: string;
  time_period: TimePeriod;
  location?: any;
}

export interface Education {
  degree?: string;
  field_study?: string[];
  grade?: string;
  school: School;
  description?: string;
  time_period: TimePeriod;
  activities?: string;
}

export interface Publication {
  name: string;
  publisher?: string;
  description?: string;
  url?: URI;
  date: any;
}

export interface Certification {
  name: string;
  id?: string;
  url?: URI;
  authority?: string;
  time_period: TimePeriod;
}

export interface VolunteerExperience {
  role: string;
  organization?: string;
  cause?: string;
  description?: string;
  time_period: TimePeriod;
}

export interface Honor {
  title: string;
  issuer?: string;
  description?: string;
  date: any;
}

export interface Project {
  title: string;
  description?: string;
  url?: URI;
  time_period: TimePeriod;
}

export interface ProfileReputation {
  follower_count: number;
  following_count: number;
  subscriber_count?: number | null;
  paid_subscriber_count?: number | null;
  content_count?: number | null;
  content_group_count?: number | null;
  watch_time_in_hours?: number | null;
  average_open_rate?: number | null;
  average_click_rate?: number | null;
}

export interface Profile {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  platform_username?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nick_name?: string | null;
  url: URI;
  introduction?: string | null;
  image_url: URI;
  date_of_birth?: string;
  external_id: string;
  platform_account_type?: string | null;
  category?: string | null;
  website?: URI | null;
  reputation: ProfileReputation;
  emails: Email[];
  phone_numbers: PhoneNumber[];
  addresses: Address[];
  gender?: Gender | null;
  country: string;
  platform_profile_name?: string | null;
  platform_profile_id?: string | null;
  platform_profile_published_at?: ISO8601DateTime | null;
  is_verified: boolean;
  is_business: boolean;
  work_experiences?: WorkExperience[];
  education?: Education[];
  publications?: Publication[];
  certifications?: Certification[];
  volunteer_experiences?: VolunteerExperience[];
  honors?: Honor[];
  projects?: Project[];
}

export interface RefreshProfileRequest {
  account_id: UUID;
}

// Audience interfaces
export interface CountryDemographic {
  code: string;
  value: number;
}

export interface CityDemographic {
  name: string;
  value: number;
}

export interface GenderAgeDemographic {
  gender: Gender;
  age_range: string;
  value: number;
}

export interface AudienceDemographics {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  countries: CountryDemographic[];
  cities: CityDemographic[];
  gender_age_distribution: GenderAgeDemographic[];
}

// Content interfaces
export interface ContentEngagement {
  like_count: number;
  dislike_count?: number;
  comment_count: number;
  impression_organic_count: number;
  reach_organic_count: number;
  save_count: number;
  view_count: number;
  watch_time_in_hours?: number | null;
  share_count?: number | null;
  impression_paid_count?: number | null;
  reach_paid_count?: number | null;
  email_open_rate?: number;
  email_click_rate?: number;
  unsubscribe_count?: number;
  spam_report_count?: number;
  click_count?: number;
  additional_info?: any;
  replay_count?: number;
  avg_watch_time_in_sec?: number;
}

export interface ContentSponsorship {
  is_sponsored: boolean;
  tags?: string;
}

export interface ContentCollaboration {
  has_collaborators: boolean;
  is_owned_by_platform_user?: boolean;
}

export interface Content {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  engagement: ContentEngagement;
  external_id: string;
  title: string;
  format: ContentFormat;
  type: ContentType;
  url: URI;
  media_url?: URI | null;
  duration?: number | null;
  description?: string;
  hashtags?: string[] | null;
  mentions?: string[] | null;
  visibility: Visibility;
  thumbnail_url?: URI;
  persistent_thumbnail_url?: URI;
  published_at: ISO8601DateTime;
  platform_profile_id: string;
  platform_profile_name: string;
  authors?: string[];
  audience?: AudienceType;
  platform?: PlatformType;
  content_tags?: string[];
  sponsored?: ContentSponsorship | null;
  collaboration?: ContentCollaboration | null;
  is_owned_by_platform_user?: boolean;
}

// Content Group interfaces
export interface ContentGroupEngagement {
  like_count: number;
  dislike_count?: number | null;
  comment_count: number;
  impression_organic_count: number;
  reach_organic_count: number;
  save_count: number;
  view_count: number;
  watch_time_in_hours?: number | null;
  share_count?: number | null;
  impression_paid_count?: number | null;
  reach_paid_count?: number | null;
  avg_watch_time_in_sec?: number;
}

export interface ContentGroup {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  engagement: ContentGroupEngagement;
  external_id: string;
  title: string;
  format: ContentFormat;
  type: ContentGroupType;
  url?: URI;
  description?: string | null;
  visibility: Visibility;
  thumbnail_url: URI;
  published_at: ISO8601DateTime;
  platform_profile_id?: string | null;
  platform_profile_name?: string | null;
  item_count: number;
  media_url?: string | null;
  media_urls?: URI[] | null;
}

// Comment interfaces
export interface Comment {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  published_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  content: ContentAttribute;
  external_id: string;
  text: string;
  commenter_username: string;
  commenter_display_name: string;
  commenter_id: string;
  commenter_profile_url?: string | null;
  like_count: number;
  reply_count: number;
}

// Activity interfaces
export interface ActivityArtist {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  platform_artist_id: string;
  image_url?: URI | null;
  artist_name: string;
  artist_url?: URI | null;
  genre: string[];
  activity_type: ActivityType;
}

export interface ActivityContentAdditionalInfo {
  genre?: string[];
  artists?: string[];
  album?: string;
}

export interface ActivityContent {
  id: UUID;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
  user: UserAttribute;
  account: AccountAttribute;
  work_platform: WorkPlatformAttribute;
  platform_content_id: string;
  title: string;
  format: ContentFormat;
  type: ContentType;
  url: URI;
  description?: string;
  thumbnail_url: URI;
  embed_url: URI;
  activity_type: ActivityType;
  additional_info?: ActivityContentAdditionalInfo;
}

// Request/Response wrapper types
export interface ListResponse<T> {
  data: T[];
  metadata: Metadata;
}

export interface BulkSearchRequest {
  ids: UUID[];
}

export interface RefreshRequest {
  account_id: UUID;
}

export interface FetchHistoricRequest {
  account_id: UUID;
  from_date: ISO8601Date;
}

// Query parameter interfaces
export interface UsersListParams extends PaginationParams {}

export interface AccountsListParams extends PaginationParams {
  user_id?: UUID;
  work_platform_id?: UUID;
}

export interface WorkPlatformsListParams extends PaginationParams {
  name?: string;
}

export interface ProfilesListParams extends PaginationParams {
  user_id?: UUID;
  work_platform_id?: UUID;
  account_id?: UUID;
}

export interface AudienceParams {
  account_id: UUID;
}

export interface ContentsListParams extends PaginationParams, DateRangeParams {
  account_id: UUID;
}

export interface ContentGroupsListParams extends PaginationParams, DateRangeParams {
  account_id: UUID;
}

export interface CommentsListParams extends PaginationParams, DateRangeParams {
  account_id: UUID;
  content_id: UUID;
}

export interface ActivityArtistsListParams extends PaginationParams {
  account_id: UUID;
}

export interface ActivityContentsListParams extends PaginationParams {
  account_id: UUID;
}