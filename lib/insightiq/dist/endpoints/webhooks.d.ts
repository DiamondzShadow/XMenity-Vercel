import { WebhookRequest, WebhookResponse, WebhookUpdateRequest, WebhooksListResponse, PaginationParams, WebhookEvent } from '../types';
export declare class WebhooksEndpoint {
    private request;
    constructor(request: <T>(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, queryParams?: Record<string, string | number | boolean | undefined>) => Promise<T>);
    /**
     * Create a webhook
     * POST /webhooks
     */
    create(data: WebhookRequest): Promise<WebhookResponse>;
    /**
     * Retrieve a webhook
     * GET /webhooks/{id}
     */
    get(id: string): Promise<WebhookResponse>;
    /**
     * Update a webhook
     * PUT /webhooks/{id}
     */
    update(id: string, data: WebhookUpdateRequest): Promise<WebhookResponse>;
    /**
     * Delete a webhook
     * DELETE /webhooks/{id}
     */
    delete(id: string): Promise<void>;
    /**
     * Retrieve all webhooks
     * GET /webhooks
     */
    list(params?: PaginationParams): Promise<WebhooksListResponse>;
    /**
     * Get all webhooks (paginated)
     * Automatically handles pagination to retrieve all webhooks
     * @warning This method loads ALL webhooks into memory.
     * For large numbers of webhooks, this may cause performance issues.
     */
    getAll(options?: {
        batchSize?: number;
        maxWebhooks?: number;
    }): Promise<WebhookResponse[]>;
    /**
     * Find webhooks by URL
     * Filters webhooks by URL pattern
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    findByUrl(urlPattern: string): Promise<WebhookResponse[]>;
    /**
     * Find webhooks by event type
     * Filters webhooks that listen to specific event types
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    findByEvent(eventType: WebhookEvent): Promise<WebhookResponse[]>;
    /**
     * Find active webhooks
     * Returns only active webhooks
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    findActive(): Promise<WebhookResponse[]>;
    /**
     * Find inactive webhooks
     * Returns only inactive webhooks
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    findInactive(): Promise<WebhookResponse[]>;
    /**
     * Disable a webhook
     * Sets a webhook to inactive without deleting it
     */
    disable(id: string): Promise<WebhookResponse>;
    /**
     * Enable a webhook
     * Sets a webhook to active
     */
    enable(id: string): Promise<WebhookResponse>;
    /**
     * Disable all webhooks
     * Sets all webhooks to inactive
     * @warning This method is NOT atomic and may trigger API rate limits.
     * If some requests fail, the system will be left in an inconsistent state.
     * Use with caution and consider implementing retry logic.
     */
    disableAll(options?: {
        batchSize?: number;
        delayBetweenBatches?: number;
    }): Promise<WebhookResponse[]>;
    /**
     * Enable all webhooks
     * Sets all webhooks to active
     * @warning This method is NOT atomic and may trigger API rate limits.
     * If some requests fail, the system will be left in an inconsistent state.
     * Use with caution and consider implementing retry logic.
     */
    enableAll(options?: {
        batchSize?: number;
        delayBetweenBatches?: number;
    }): Promise<WebhookResponse[]>;
}
