import { CommentsAnalyticsRequest, CommentsAnalyticsResponse, CommentsAnalyticsInsights, CommentsStreamResponse, CommentsQueryParams } from '../types';
export declare class CommentsAnalyticsEndpoint {
    private request;
    constructor(request: <T>(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, queryParams?: Record<string, string | number | boolean | undefined>) => Promise<T>);
    /**
     * Create a comments relevance analysis request
     * POST /insights/comments-analytics
     */
    createAnalysis(data: CommentsAnalyticsRequest): Promise<CommentsAnalyticsResponse>;
    /**
     * Get comments relevance insights
     * GET /insights/comments-analytics/{id}
     */
    getInsights(id: string): Promise<CommentsAnalyticsInsights>;
    /**
     * Get the stream of analysed comments
     * GET /insights/comments-analytics/{id}/comments
     */
    getComments(id: string, params: CommentsQueryParams): Promise<CommentsStreamResponse>;
    /**
     * Poll for analysis completion
     * Continuously checks the status until completion or timeout
     */
    waitForCompletion(id: string, options?: {
        timeout?: number;
        interval?: number;
    }): Promise<CommentsAnalyticsInsights>;
}
