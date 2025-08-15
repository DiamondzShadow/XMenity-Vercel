import { InsightIQConfig } from './types';
import { CommentsAnalyticsEndpoint, PurchaseIntentEndpoint, SocialListeningEndpoint, WebhooksEndpoint } from './endpoints';
export declare class InsightIQClient {
    private username;
    private password;
    private baseUrl;
    private authHeader;
    readonly commentsAnalytics: CommentsAnalyticsEndpoint;
    readonly purchaseIntent: PurchaseIntentEndpoint;
    readonly socialListening: SocialListeningEndpoint;
    readonly webhooks: WebhooksEndpoint;
    constructor(config: InsightIQConfig);
    /**
     * Make an authenticated HTTP request to the InsightIQ API
     */
    private makeRequest;
    /**
     * Get the base URL being used by the client
     */
    getBaseUrl(): string;
    /**
     * Test the client connection and authentication
     */
    testConnection(): Promise<boolean>;
    protected request<T>(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, queryParams?: Record<string, string | number | boolean | undefined>): Promise<T>;
}
