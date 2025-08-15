import { SocialListeningRequest, SocialListeningResponse, SocialListeningInsights, SocialListeningQueryParams } from '../types';
export declare class SocialListeningEndpoint {
    private request;
    constructor(request: <T>(endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, queryParams?: Record<string, string | number | boolean | undefined>) => Promise<T>);
    /**
     * Create a social listening request
     * POST /social/creators/contents/search
     */
    createSearch(data: SocialListeningRequest): Promise<SocialListeningResponse>;
    /**
     * Get status of the submitted social listening request
     * GET /social/creators/contents/search/{id}
     */
    getStatus(id: string): Promise<SocialListeningResponse>;
    /**
     * Get social listening insights
     * GET /social/creators/contents/search/{id}/fetch
     */
    getInsights(id: string, params?: SocialListeningQueryParams): Promise<SocialListeningInsights>;
    /**
     * Poll for search completion
     * Continuously checks the status until completion or timeout
     */
    waitForCompletion(id: string, options?: {
        timeout?: number;
        interval?: number;
    }): Promise<SocialListeningResponse>;
    /**
     * Get all social content (paginated)
     * Automatically handles pagination to retrieve all content
     * @warning This method loads ALL content into memory.
     * For large datasets, this may cause performance issues.
     */
    getAllContent(id: string, options?: {
        batchSize?: number;
        maxContent?: number;
        from_date?: string;
        to_date?: string;
    }): Promise<SocialListeningInsights['data']>;
    /**
     * Search for content by keyword
     * Convenience method for keyword-based searches
     */
    searchByKeyword(workPlatformId: string, keyword: string, options?: {
        itemsLimit?: number;
        from_date?: string;
        to_date?: string;
        waitForCompletion?: boolean;
    }): Promise<SocialListeningResponse>;
    /**
     * Search for content by hashtag
     * Convenience method for hashtag-based searches
     */
    searchByHashtag(workPlatformId: string, hashtag: string, options?: {
        itemsLimit?: number;
        from_date?: string;
        to_date?: string;
        waitForCompletion?: boolean;
    }): Promise<SocialListeningResponse>;
    /**
     * Search for content by mention
     * Convenience method for mention-based searches
     */
    searchByMention(workPlatformId: string, mention: string, options?: {
        itemsLimit?: number;
        from_date?: string;
        to_date?: string;
        waitForCompletion?: boolean;
    }): Promise<SocialListeningResponse>;
    /**
     * Search for TikTok content by audio track
     * Convenience method for TikTok audio-based searches
     */
    searchByAudioTrack(workPlatformId: string, audioTrack: {
        title: string;
        id: string;
    }, options?: {
        itemsLimit?: number;
        waitForCompletion?: boolean;
    }): Promise<SocialListeningResponse>;
}
