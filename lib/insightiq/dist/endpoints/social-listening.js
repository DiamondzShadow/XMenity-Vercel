"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialListeningEndpoint = void 0;
const types_1 = require("../types");
class SocialListeningEndpoint {
    constructor(request) {
        this.request = request;
    }
    /**
     * Create a social listening request
     * POST /social/creators/contents/search
     */
    async createSearch(data) {
        return this.request('/social/creators/contents/search', 'POST', data);
    }
    /**
     * Get status of the submitted social listening request
     * GET /social/creators/contents/search/{id}
     */
    async getStatus(id) {
        return this.request(`/social/creators/contents/search/${id}`);
    }
    /**
     * Get social listening insights
     * GET /social/creators/contents/search/{id}/fetch
     */
    async getInsights(id, params = {}) {
        return this.request(`/social/creators/contents/search/${id}/fetch`, 'GET', undefined, params);
    }
    /**
     * Poll for search completion
     * Continuously checks the status until completion or timeout
     */
    async waitForCompletion(id, options = {}) {
        const timeout = options.timeout || 15 * 60 * 1000; // 15 minutes (social listening can take longer)
        const interval = options.interval || 15 * 1000; // 15 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const status = await this.getStatus(id);
            if (status.status === 'SUCCESS') {
                return status;
            }
            if (status.status === 'FAILURE') {
                throw new types_1.AnalysisFailedError(id);
            }
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new types_1.AnalysisTimeoutError(id, timeout);
    }
    /**
     * Get all social content (paginated)
     * Automatically handles pagination to retrieve all content
     * @warning This method loads ALL content into memory.
     * For large datasets, this may cause performance issues.
     */
    async getAllContent(id, options = {}) {
        const batchSize = options.batchSize || 100;
        const maxContent = options.maxContent || Infinity;
        let allContent = [];
        let offset = 0;
        while (allContent.length < maxContent) {
            const response = await this.getInsights(id, {
                limit: Math.min(batchSize, maxContent - allContent.length),
                offset,
                from_date: options.from_date,
                to_date: options.to_date
            });
            if (response.data.length === 0) {
                break; // No more content
            }
            allContent = allContent.concat(response.data);
            offset += response.data.length;
            // If we got fewer items than requested, we've reached the end
            if (response.data.length < batchSize) {
                break;
            }
        }
        return allContent;
    }
    /**
     * Search for content by keyword
     * Convenience method for keyword-based searches
     */
    async searchByKeyword(workPlatformId, keyword, options = {}) {
        const searchRequest = {
            work_platform_id: workPlatformId,
            keyword,
            items_limit: options.itemsLimit,
            from_date: options.from_date,
            to_date: options.to_date
        };
        const response = await this.createSearch(searchRequest);
        if (options.waitForCompletion) {
            return this.waitForCompletion(response.id);
        }
        return response;
    }
    /**
     * Search for content by hashtag
     * Convenience method for hashtag-based searches
     */
    async searchByHashtag(workPlatformId, hashtag, options = {}) {
        const searchRequest = {
            work_platform_id: workPlatformId,
            hashtag,
            items_limit: options.itemsLimit,
            from_date: options.from_date,
            to_date: options.to_date
        };
        const response = await this.createSearch(searchRequest);
        if (options.waitForCompletion) {
            return this.waitForCompletion(response.id);
        }
        return response;
    }
    /**
     * Search for content by mention
     * Convenience method for mention-based searches
     */
    async searchByMention(workPlatformId, mention, options = {}) {
        const searchRequest = {
            work_platform_id: workPlatformId,
            mention,
            items_limit: options.itemsLimit,
            from_date: options.from_date,
            to_date: options.to_date
        };
        const response = await this.createSearch(searchRequest);
        if (options.waitForCompletion) {
            return this.waitForCompletion(response.id);
        }
        return response;
    }
    /**
     * Search for TikTok content by audio track
     * Convenience method for TikTok audio-based searches
     */
    async searchByAudioTrack(workPlatformId, audioTrack, options = {}) {
        const searchRequest = {
            work_platform_id: workPlatformId,
            audio_track_info: audioTrack,
            items_limit: options.itemsLimit
        };
        const response = await this.createSearch(searchRequest);
        if (options.waitForCompletion) {
            return this.waitForCompletion(response.id);
        }
        return response;
    }
}
exports.SocialListeningEndpoint = SocialListeningEndpoint;
