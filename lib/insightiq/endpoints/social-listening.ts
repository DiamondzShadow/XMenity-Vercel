import {
  SocialListeningRequest,
  SocialListeningResponse,
  SocialListeningInsights,
  SocialListeningQueryParams,
  AnalysisFailedError,
  AnalysisTimeoutError
} from '../types';

export class SocialListeningEndpoint {
  constructor(private request: <T>(
    endpoint: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string | number | boolean | undefined>
  ) => Promise<T>) {}

  /**
   * Create a social listening request
   * POST /social/creators/contents/search
   */
  async createSearch(data: SocialListeningRequest): Promise<SocialListeningResponse> {
    return this.request<SocialListeningResponse>(
      '/social/creators/contents/search',
      'POST',
      data
    );
  }

  /**
   * Get status of the submitted social listening request
   * GET /social/creators/contents/search/{id}
   */
  async getStatus(id: string): Promise<SocialListeningResponse> {
    return this.request<SocialListeningResponse>(
      `/social/creators/contents/search/${id}`
    );
  }

  /**
   * Get social listening insights
   * GET /social/creators/contents/search/{id}/fetch
   */
  async getInsights(
    id: string,
    params: SocialListeningQueryParams = {}
  ): Promise<SocialListeningInsights> {
    return this.request<SocialListeningInsights>(
      `/social/creators/contents/search/${id}/fetch`,
      'GET',
      undefined,
      params
    );
  }

  /**
   * Poll for search completion
   * Continuously checks the status until completion or timeout
   */
  async waitForCompletion(
    id: string,
    options: {
      timeout?: number; // in milliseconds, default 15 minutes
      interval?: number; // in milliseconds, default 15 seconds
    } = {}
  ): Promise<SocialListeningResponse> {
    const timeout = options.timeout || 15 * 60 * 1000; // 15 minutes (social listening can take longer)
    const interval = options.interval || 15 * 1000; // 15 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getStatus(id);
      
      if (status.status === 'SUCCESS') {
        return status;
      }
      
      if (status.status === 'FAILURE') {
        throw new AnalysisFailedError(id);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new AnalysisTimeoutError(id, timeout);
  }

  /**
   * Get all social content (paginated)
   * Automatically handles pagination to retrieve all content
   * @warning This method loads ALL content into memory. 
   * For large datasets, this may cause performance issues.
   */
  async getAllContent(
    id: string,
    options: {
      batchSize?: number; // default 100 (but API might have lower limits)
      maxContent?: number; // default unlimited
      from_date?: string;
      to_date?: string;
    } = {}
  ): Promise<SocialListeningInsights['data']> {
    const batchSize = options.batchSize || 100;
    const maxContent = options.maxContent || Infinity;
    let allContent: SocialListeningInsights['data'] = [];
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
  async searchByKeyword(
    workPlatformId: string,
    keyword: string,
    options: {
      itemsLimit?: number;
      from_date?: string;
      to_date?: string;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<SocialListeningResponse> {
    const searchRequest: SocialListeningRequest = {
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
  async searchByHashtag(
    workPlatformId: string,
    hashtag: string,
    options: {
      itemsLimit?: number;
      from_date?: string;
      to_date?: string;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<SocialListeningResponse> {
    const searchRequest: SocialListeningRequest = {
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
  async searchByMention(
    workPlatformId: string,
    mention: string,
    options: {
      itemsLimit?: number;
      from_date?: string;
      to_date?: string;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<SocialListeningResponse> {
    const searchRequest: SocialListeningRequest = {
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
  async searchByAudioTrack(
    workPlatformId: string,
    audioTrack: { title: string; id: string },
    options: {
      itemsLimit?: number;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<SocialListeningResponse> {
    const searchRequest: SocialListeningRequest = {
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