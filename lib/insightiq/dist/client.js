"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightIQClient = void 0;
const types_1 = require("./types");
const endpoints_1 = require("./endpoints");
class InsightIQClient {
    constructor(config) {
        this.username = config.username;
        this.password = config.password;
        this.baseUrl = config.baseUrl || (config.sandbox !== false
            ? 'https://api.sandbox.insightiq.ai/v1'
            : 'https://api.insightiq.ai/v1');
        // Create base64 encoded auth header
        this.authHeader = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;
        // Initialize endpoint instances
        this.commentsAnalytics = new endpoints_1.CommentsAnalyticsEndpoint(this.request.bind(this));
        this.purchaseIntent = new endpoints_1.PurchaseIntentEndpoint(this.request.bind(this));
        this.socialListening = new endpoints_1.SocialListeningEndpoint(this.request.bind(this));
        this.webhooks = new endpoints_1.WebhooksEndpoint(this.request.bind(this));
    }
    /**
     * Make an authenticated HTTP request to the InsightIQ API
     */
    async makeRequest(endpoint, method = 'GET', body, queryParams) {
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
        const headers = {
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
                }
                catch {
                    errorDetails = errorText;
                }
                throw new types_1.APIError(`API request failed: ${response.status} ${response.statusText}`, response.status, errorDetails);
            }
            // Handle 204 No Content responses
            if (response.status === 204) {
                return {};
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof types_1.APIError) {
                throw error; // Re-throw API errors as-is
            }
            throw new types_1.APIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0, error);
        }
    }
    /**
     * Get the base URL being used by the client
     */
    getBaseUrl() {
        return this.baseUrl;
    }
    /**
     * Test the client connection and authentication
     */
    async testConnection() {
        try {
            // Try to list webhooks as a test endpoint
            await this.makeRequest('/webhooks', 'GET', undefined, { limit: 1 });
            return true;
        }
        catch {
            return false;
        }
    }
    // Protected method for use by endpoint classes
    async request(endpoint, method = 'GET', body, queryParams) {
        return this.makeRequest(endpoint, method, body, queryParams);
    }
}
exports.InsightIQClient = InsightIQClient;
