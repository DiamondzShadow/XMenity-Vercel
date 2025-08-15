import type { InsightIQClient } from '../client';
import type {
  ActivityContent,
  ListResponse,
  ActivityContentsListParams,
  BulkSearchRequest,
  ActivityType,
  UUID
} from '../types';

export class ActivityContentsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve an activity content by ID
   */
  async get(id: UUID): Promise<ActivityContent> {
    return this.client.get<ActivityContent>(`/media/activity/contents/${id}`);
  }

  /**
   * List all activity contents with pagination and filtering
   */
  async list(params: ActivityContentsListParams): Promise<ListResponse<ActivityContent>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<ActivityContent>>(`/media/activity/contents${queryString}`);
  }

  /**
   * Retrieve activity contents in bulk by IDs
   */
  async searchBulk(ids: UUID[]): Promise<ListResponse<ActivityContent>> {
    const requestData: BulkSearchRequest = { ids };
    return this.client.post<ListResponse<ActivityContent>>('/media/activity/contents/search', requestData);
  }

  /**
   * Get all activity contents for an account (convenience method that handles pagination)
   */
  async getAllForAccount(accountId: UUID): Promise<ActivityContent[]> {
    const allContents: ActivityContent[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const params: ActivityContentsListParams = { 
        account_id: accountId, 
        limit, 
        offset
      };
      
      const response = await this.list(params);
      allContents.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allContents;
  }

  /**
   * Get activity contents by type
   */
  async getByActivityType(accountId: UUID, activityType: ActivityType): Promise<ActivityContent[]> {
    const allContents = await this.getAllForAccount(accountId);
    return allContents.filter(content => content.activity_type === activityType);
  }

  /**
   * Get top contents for an account
   */
  async getTopContents(accountId: UUID): Promise<ActivityContent[]> {
    return this.getByActivityType(accountId, ActivityType.TOP);
  }

  /**
   * Get recent contents for an account
   */
  async getRecentContents(accountId: UUID): Promise<ActivityContent[]> {
    return this.getByActivityType(accountId, ActivityType.RECENT);
  }

  /**
   * Get saved contents for an account
   */
  async getSavedContents(accountId: UUID): Promise<ActivityContent[]> {
    return this.getByActivityType(accountId, ActivityType.SAVED);
  }

  /**
   * Get contents by genre
   */
  async getByGenre(accountId: UUID, genre: string): Promise<ActivityContent[]> {
    const allContents = await this.getAllForAccount(accountId);
    return allContents.filter(content => 
      content.additional_info?.genre?.some(g => 
        g.toLowerCase().includes(genre.toLowerCase())
      )
    );
  }

  /**
   * Get contents by artist
   */
  async getByArtist(accountId: UUID, artistName: string): Promise<ActivityContent[]> {
    const allContents = await this.getAllForAccount(accountId);
    return allContents.filter(content => 
      content.additional_info?.artists?.some(artist => 
        artist.toLowerCase().includes(artistName.toLowerCase())
      )
    );
  }

  /**
   * Get contents by album
   */
  async getByAlbum(accountId: UUID, albumName: string): Promise<ActivityContent[]> {
    const allContents = await this.getAllForAccount(accountId);
    return allContents.filter(content => 
      content.additional_info?.album?.toLowerCase().includes(albumName.toLowerCase())
    );
  }
}