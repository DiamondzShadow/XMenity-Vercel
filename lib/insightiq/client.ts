import { 
  createErrorFromResponse, 
  NetworkError, 
  ConfigurationError,
  TimeoutError 
} from './errors';

// Service imports
import { UsersService } from './services/users';
import { AccountsService } from './services/accounts';
import { TokensService } from './services/tokens';
import { LinksService } from './services/links';
import { WorkPlatformsService } from './services/work-platforms';
import { ProfilesService } from './services/profiles';
import { AudienceService } from './services/audience';
import { ContentsService } from './services/contents';
import { ContentGroupsService } from './services/content-groups';
import { PublicationContentsService } from './services/publication-contents';
import { CommentsService } from './services/comments';
import { ActivityArtistsService } from './services/activity-artists';
import { ActivityContentsService } from './services/activity-contents';

export interface InsightIQClientConfig {
  username: string;
  password: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class InsightIQClient {
  private readonly config: Required<InsightIQClientConfig>;
  private readonly authHeader: string;

  // Service instances
  public readonly users: UsersService;
  public readonly accounts: AccountsService;
  public readonly tokens: TokensService;
  public readonly links: LinksService;
  public readonly workPlatforms: WorkPlatformsService;
  public readonly profiles: ProfilesService;
  public readonly audience: AudienceService;
  public readonly contents: ContentsService;
  public readonly contentGroups: ContentGroupsService;
  public readonly publicationContents: PublicationContentsService;
  public readonly comments: CommentsService;
  public readonly activityArtists: ActivityArtistsService;
  public readonly activityContents: ActivityContentsService;

  constructor(config: InsightIQClientConfig) {
    if (!config.username || !config.password) {
      throw new ConfigurationError('Username and password are required');
    }

    this.config = {
      username: config.username,
      password: config.password,
      baseUrl: config.baseUrl || 'https://api.sandbox.insightiq.ai/v1',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    // Create base64 encoded auth header
    this.authHeader = `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`;

    // Initialize all services
    this.users = new UsersService(this);
    this.accounts = new AccountsService(this);
    this.tokens = new TokensService(this);
    this.links = new LinksService(this);
    this.workPlatforms = new WorkPlatformsService(this);
    this.profiles = new ProfilesService(this);
    this.audience = new AudienceService(this);
    this.contents = new ContentsService(this);
    this.contentGroups = new ContentGroupsService(this);
    this.publicationContents = new PublicationContentsService(this);
    this.comments = new CommentsService(this);
    this.activityArtists = new ActivityArtistsService(this);
    this.activityContents = new ActivityContentsService(this);
  }

  /**
   * Make an HTTP request with automatic retries and error handling
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;
    const maxRetries = options.retries !== undefined ? options.retries : this.config.retryAttempts;

    const requestHeaders: Record<string, string> = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'InsightIQ-SDK/1.0.0',
      ...options.headers,
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
          fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Extract request ID from headers for error tracking
        const requestId = response.headers.get('request-id') || undefined;

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          const errorMessage = errorData.message || errorData.error || `HTTP ${response.status} Error`;
          throw createErrorFromResponse(response.status, errorMessage, requestId, errorData);
        }

        // Handle different response types
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          return result as T;
        } else {
          // For non-JSON responses (like 202 Accepted with empty body)
          return {} as T;
        }

      } catch (error) {
        lastError = error as Error;

        // Don't retry certain types of errors
        if (
          error instanceof TypeError && error.message.includes('fetch') ||
          error.name === 'AbortError'
        ) {
          if (error.name === 'AbortError') {
            throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
          }
          throw new NetworkError('Network request failed', error as Error);
        }

        // Don't retry 4xx errors (except 408, 429)
        if ('statusCode' in error && typeof error.statusCode === 'number') {
          const statusCode = error.statusCode;
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        await this.sleep(this.config.retryDelay * (attempt + 1));
      }
    }

    throw lastError;
  }

  /**
   * Helper method for GET requests
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Helper method for POST requests
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * Helper method for PUT requests
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * Helper method for DELETE requests
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the current configuration
   */
  getConfig(): Omit<Required<InsightIQClientConfig>, 'password'> {
    const { password, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Test the connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.workPlatforms.list({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}