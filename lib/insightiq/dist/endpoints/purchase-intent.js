"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseIntentEndpoint = void 0;
const types_1 = require("../types");
class PurchaseIntentEndpoint {
    constructor(request) {
        this.request = request;
    }
    /**
     * Create a purchase intent analysis request
     * POST /insights/profiles/comments-analytics
     */
    async createAnalysis(data) {
        return this.request('/insights/profiles/comments-analytics', 'POST', data);
    }
    /**
     * Get purchase intent insights
     * GET /insights/profiles/comments-analytics/{id}
     */
    async getInsights(id) {
        return this.request(`/insights/profiles/comments-analytics/${id}`);
    }
    /**
     * Get the stream of analysed comments with purchase intent
     * GET /insights/profiles/comments-analytics/{id}/comments
     */
    async getComments(id, params = {}) {
        return this.request(`/insights/profiles/comments-analytics/${id}/comments`, 'GET', undefined, params);
    }
    /**
     * Poll for analysis completion
     * Continuously checks the status until completion or timeout
     */
    async waitForCompletion(id, options = {}) {
        const timeout = options.timeout || 10 * 60 * 1000; // 10 minutes (profile analysis takes longer)
        const interval = options.interval || 10 * 1000; // 10 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const insights = await this.getInsights(id);
            if (insights.status === 'SUCCESS') {
                return insights;
            }
            if (insights.status === 'FAILURE') {
                throw new types_1.AnalysisFailedError(id);
            }
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new types_1.AnalysisTimeoutError(id, timeout);
    }
    /**
     * Get all comments with purchase intent (paginated)
     * Automatically handles pagination to retrieve all comments
     * @warning This method loads ALL comments into memory.
     * For large datasets, consider using streamAllComments() instead.
     */
    async getAllComments(id, options = {}) {
        const batchSize = Math.min(options.batchSize || 100, 100);
        const maxComments = options.maxComments || Infinity;
        let allComments = [];
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
    /**
     * Stream all comments with purchase intent using async iterator
     * Memory-efficient alternative to getAllComments()
     * @example
     * for await (const comment of client.purchaseIntent.streamAllComments(id)) {
     *   processComment(comment);
     * }
     */
    async *streamAllComments(id, options = {}) {
        const batchSize = Math.min(options.batchSize || 100, 100);
        const maxComments = options.maxComments || Infinity;
        let processedCount = 0;
        let offset = 0;
        while (processedCount < maxComments) {
            const response = await this.getComments(id, {
                limit: Math.min(batchSize, maxComments - processedCount),
                offset
            });
            if (response.data.length === 0) {
                break; // No more comments
            }
            for (const comment of response.data) {
                if (processedCount >= maxComments)
                    break;
                yield comment;
                processedCount++;
            }
            offset += response.data.length;
            // If we got fewer comments than requested, we've reached the end
            if (response.data.length < batchSize) {
                break;
            }
        }
    }
}
exports.PurchaseIntentEndpoint = PurchaseIntentEndpoint;
