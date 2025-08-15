"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsAnalyticsEndpoint = void 0;
const types_1 = require("../types");
class CommentsAnalyticsEndpoint {
    constructor(request) {
        this.request = request;
    }
    /**
     * Create a comments relevance analysis request
     * POST /insights/comments-analytics
     */
    async createAnalysis(data) {
        return this.request('/insights/comments-analytics', 'POST', data);
    }
    /**
     * Get comments relevance insights
     * GET /insights/comments-analytics/{id}
     */
    async getInsights(id) {
        return this.request(`/insights/comments-analytics/${id}`);
    }
    /**
     * Get the stream of analysed comments
     * GET /insights/comments-analytics/{id}/comments
     */
    async getComments(id, params) {
        return this.request(`/insights/comments-analytics/${id}/comments`, 'GET', undefined, params);
    }
    /**
     * Poll for analysis completion
     * Continuously checks the status until completion or timeout
     */
    async waitForCompletion(id, options = {}) {
        const timeout = options.timeout || 5 * 60 * 1000; // 5 minutes
        const interval = options.interval || 5 * 1000; // 5 seconds
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
}
exports.CommentsAnalyticsEndpoint = CommentsAnalyticsEndpoint;
