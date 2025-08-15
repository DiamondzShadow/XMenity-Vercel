import { InsightIQConfig, APIError } from './types';
import { 
  CommentsAnalyticsEndpoint, 
  PurchaseIntentEndpoint, 
  SocialListeningEndpoint, 
  WebhooksEndpoint 
} from './endpoints';

export class InsightIQClient {
  private username: string;
  private password: string;
  private baseUrl: string;
  private authHeader: string;

  // Endpoint instances
  public readonly commentsAnalytics: CommentsAnalyticsEndpoint;
  public readonly purchaseIntent: PurchaseIntentEndpoint;
  public readonly socialListening: SocialListeningEndpoint;
  public readonly webhooks: WebhooksEndpoint;

  constructor(config: InsightIQConfig) {
    this.username = config.username;
    this.password = config.password;
    this.baseUrl = config.baseUrl || (config.sandbox !== false 
      ? 'https://api.sandbox.insightiq.ai/v1' 
      : 'https://api.insightiq.ai/v1'
    );
    
    // Create base64 encoded auth header
    this.authHeader = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;
    
    // Initialize endpoint instances
    this.commentsAnalytics = new CommentsAnalyticsEndpoint(this.request.bind(this));
    this.purchaseIntent = new PurchaseIntentEndpoint(this.request.bind(this));
    this.socialListening = new SocialListeningEndpoint(this.request.bind(this));
    this.webhooks = new WebhooksEndpoint(this.request.bind(this));
  }

  /**
   * Make an authenticated HTTP request to the InsightIQ API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    queryParams?: Record<string, string | number | boolean>
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Add query parameters if provided
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
    };

    if (body && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = errorText;
        }
        
        throw new Error(JSON.stringify({
          message: `API request failed: ${response.status} ${response.statusText}`,
          status: response.status,
          details: errorDetails
        } as APIError));
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('{')) {
        throw error; // Re-throw API errors as-is
      }
      
      throw new Error(JSON.stringify({
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
        details: error
      } as APIError));
    }
  }

  /**
   * Get the base URL being used by the client
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Test the client connection and authentication
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Try to list webhooks as a test endpoint
      await this.makeRequest('/webhooks', 'GET', undefined, { limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  // Protected method for use by endpoint classes
  protected async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    queryParams?: Record<string, string | number | boolean>
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, method, body, queryParams);
  }
}