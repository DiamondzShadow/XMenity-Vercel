import { PurchaseIntentRequest, PurchaseIntentResponse, PurchaseIntentInsights, PurchaseIntentCommentsResponse, PaginationParams } from '../types';
export declare class PurchaseIntentEndpoint {
    private request;
    constructor(request: <T>(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, queryParams?: Record<string, string | number | boolean | undefined>) => Promise<T>);
    /**
     * Create a purchase intent analysis request
     * POST /insights/profiles/comments-analytics
     */
    createAnalysis(data: PurchaseIntentRequest): Promise<PurchaseIntentResponse>;
    /**
     * Get purchase intent insights
     * GET /insights/profiles/comments-analytics/{id}
     */
    getInsights(id: string): Promise<PurchaseIntentInsights>;
    /**
     * Get the stream of analysed comments with purchase intent
     * GET /insights/profiles/comments-analytics/{id}/comments
     */
    getComments(id: string, params?: PaginationParams): Promise<PurchaseIntentCommentsResponse>;
    /**
     * Poll for analysis completion
     * Continuously checks the status until completion or timeout
     */
    waitForCompletion(id: string, options?: {
        timeout?: number;
        interval?: number;
    }): Promise<PurchaseIntentInsights>;
    /**
     * Get all comments with purchase intent (paginated)
     * Automatically handles pagination to retrieve all comments
     * @warning This method loads ALL comments into memory.
     * For large datasets, consider using streamAllComments() instead.
     */
    getAllComments(id: string, options?: {
        batchSize?: number;
        maxComments?: number;
    }): Promise<PurchaseIntentCommentsResponse['data']>;
    /**
     * Stream all comments with purchase intent using async iterator
     * Memory-efficient alternative to getAllComments()
     * @example
     * for await (const comment of client.purchaseIntent.streamAllComments(id)) {
     *   processComment(comment);
     * }
     */
    streamAllComments(id: string, options?: {
        batchSize?: number;
        maxComments?: number;
    }): AsyncGenerator<PurchaseIntentCommentsResponse['data'][0], void, unknown>;
}
