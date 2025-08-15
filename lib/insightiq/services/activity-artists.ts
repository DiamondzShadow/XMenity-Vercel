import type { InsightIQClient } from '../client';
import type {
  ActivityArtist,
  ListResponse,
  ActivityArtistsListParams,
  BulkSearchRequest,
  UUID
} from '../types';

export class ActivityArtistsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve an activity artist by ID
   */
  async get(id: UUID): Promise<ActivityArtist> {
    return this.client.get<ActivityArtist>(`/media/activity/artists/${id}`);
  }

  /**
   * List all activity artists with pagination and filtering
   */
  async list(params: ActivityArtistsListParams): Promise<ListResponse<ActivityArtist>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<ActivityArtist>>(`/media/activity/artists${queryString}`);
  }

  /**
   * Retrieve activity artists in bulk by IDs
   */
  async searchBulk(ids: UUID[]): Promise<ListResponse<ActivityArtist>> {
    const requestData: BulkSearchRequest = { ids };
    return this.client.post<ListResponse<ActivityArtist>>('/media/activity/artists/search', requestData);
  }

  /**
   * Get all activity artists for an account (convenience method that handles pagination)
   */
  async getAllForAccount(accountId: UUID): Promise<ActivityArtist[]> {
    const allArtists: ActivityArtist[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const params: ActivityArtistsListParams = { 
        account_id: accountId, 
        limit, 
        offset
      };
      
      const response = await this.list(params);
      allArtists.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allArtists;
  }

  /**
   * Get followed artists for an account
   */
  async getFollowedArtists(accountId: UUID): Promise<ActivityArtist[]> {
    const allArtists = await this.getAllForAccount(accountId);
    return allArtists.filter(artist => artist.activity_type === 'FOLLOWED');
  }

  /**
   * Get top artists for an account
   */
  async getTopArtists(accountId: UUID): Promise<ActivityArtist[]> {
    const allArtists = await this.getAllForAccount(accountId);
    return allArtists.filter(artist => artist.activity_type === 'TOP');
  }

  /**
   * Get artists by genre
   */
  async getByGenre(accountId: UUID, genre: string): Promise<ActivityArtist[]> {
    const allArtists = await this.getAllForAccount(accountId);
    return allArtists.filter(artist => 
      artist.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
  }
}