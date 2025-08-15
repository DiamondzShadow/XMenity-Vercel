import {
  PurchaseIntentRequest,
  PurchaseIntentResponse,
  PurchaseIntentInsights,
  PurchaseIntentCommentsResponse,
  PaginationParams
} from '../types';

export class PurchaseIntentEndpoint {
  constructor(private request: <T>(
    endpoint: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string | number | boolean>
  ) => Promise<T>) {}

  /**
   * Create a purchase intent analysis request
   * POST /insights/profiles/comments-analytics
   */
  async createAnalysis(data: PurchaseIntentRequest): Promise<PurchaseIntentResponse> {
    return this.request<PurchaseIntentResponse>(
      '/insights/profiles/comments-analytics',
      'POST',
      data
    );
  }

  /**
   * Get purchase intent insights
   * GET /insights/profiles/comments-analytics/{id}
   */
  async getInsights(id: string): Promise<PurchaseIntentInsights> {
    return this.request<PurchaseIntentInsights>(
      `/insights/profiles/comments-analytics/${id}`
    );
  }

  /**
   * Get the stream of analysed comments with purchase intent
   * GET /insights/profiles/comments-analytics/{id}/comments
   */
  async getComments(
    id: string,
    params: PaginationParams = {}
  ): Promise<PurchaseIntentCommentsResponse> {
    return this.request<PurchaseIntentCommentsResponse>(
      `/insights/profiles/comments-analytics/${id}/comments`,
      'GET',
      undefined,
      params
    );
  }

  /**
   * Poll for analysis completion
   * Continuously checks the status until completion or timeout
   */
  async waitForCompletion(
    id: string,
    options: {
      timeout?: number; // in milliseconds, default 10 minutes
      interval?: number; // in milliseconds, default 10 seconds
    } = {}
  ): Promise<PurchaseIntentInsights> {
    const timeout = options.timeout || 10 * 60 * 1000; // 10 minutes (profile analysis takes longer)
    const interval = options.interval || 10 * 1000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const insights = await this.getInsights(id);
      
      if (insights.status === 'SUCCESS') {
        return insights;
      }
      
      if (insights.status === 'FAILURE') {
        throw new Error(`Purchase intent analysis failed for job ${id}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Purchase intent analysis timeout for job ${id}`);
  }

  /**
   * Get all comments with purchase intent (paginated)
   * Automatically handles pagination to retrieve all comments
   */
  async getAllComments(
    id: string,
    options: {
      batchSize?: number; // default 100 (max allowed)
      maxComments?: number; // default unlimited
    } = {}
  ): Promise<PurchaseIntentCommentsResponse['data']> {
    const batchSize = Math.min(options.batchSize || 100, 100);
    const maxComments = options.maxComments || Infinity;
    let allComments: PurchaseIntentCommentsResponse['data'] = [];
    let offset = 0;

    while (allComments.length < maxComments) {
      const response = await this.getComments(id, {
        limit: Math.min(batchSize, maxComments - allComments.length),
        offset
      });

      if (response.data.length === 0) {
        break; // No more comments
      }

      allComments = allComments.concat(response.data);
      offset += response.data.length;

      // If we got fewer comments than requested, we've reached the end
      if (response.data.length < batchSize) {
        break;
      }
    }

    return allComments;
  }
}