import {
  CommentsAnalyticsRequest,
  CommentsAnalyticsResponse,
  CommentsAnalyticsInsights,
  CommentsStreamResponse,
  CommentsQueryParams
} from '../types';

export class CommentsAnalyticsEndpoint {
  constructor(private request: <T>(
    endpoint: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string | number | boolean>
  ) => Promise<T>) {}

  /**
   * Create a comments relevance analysis request
   * POST /insights/comments-analytics
   */
  async createAnalysis(data: CommentsAnalyticsRequest): Promise<CommentsAnalyticsResponse> {
    return this.request<CommentsAnalyticsResponse>(
      '/insights/comments-analytics',
      'POST',
      data
    );
  }

  /**
   * Get comments relevance insights
   * GET /insights/comments-analytics/{id}
   */
  async getInsights(id: string): Promise<CommentsAnalyticsInsights> {
    return this.request<CommentsAnalyticsInsights>(
      `/insights/comments-analytics/${id}`
    );
  }

  /**
   * Get the stream of analysed comments
   * GET /insights/comments-analytics/{id}/comments
   */
  async getComments(
    id: string,
    params: CommentsQueryParams
  ): Promise<CommentsStreamResponse> {
    return this.request<CommentsStreamResponse>(
      `/insights/comments-analytics/${id}/comments`,
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
      timeout?: number; // in milliseconds, default 5 minutes
      interval?: number; // in milliseconds, default 5 seconds
    } = {}
  ): Promise<CommentsAnalyticsInsights> {
    const timeout = options.timeout || 5 * 60 * 1000; // 5 minutes
    const interval = options.interval || 5 * 1000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const insights = await this.getInsights(id);
      
      if (insights.status === 'SUCCESS') {
        return insights;
      }
      
      if (insights.status === 'FAILURE') {
        throw new Error(`Analysis failed for job ${id}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Analysis timeout for job ${id}`);
  }
}