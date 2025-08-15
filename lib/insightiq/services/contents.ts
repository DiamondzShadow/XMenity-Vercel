import type { InsightIQClient } from '../client';
import type {
  Content,
  ListResponse,
  ContentsListParams,
  RefreshRequest,
  FetchHistoricRequest,
  BulkSearchRequest,
  UUID
} from '../types';

export class ContentsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve a content item by ID
   */
  async get(id: UUID): Promise<Content> {
    return this.client.get<Content>(`/social/contents/${id}`);
  }

  /**
   * List all content items with pagination and filtering
   */
  async list(params: ContentsListParams): Promise<ListResponse<Content>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<Content>>(`/social/contents${queryString}`);
  }

  /**
   * Refresh content items for a connected account
   */
  async refresh(accountId: UUID): Promise<{ account_id: UUID }> {
    const requestData: RefreshRequest = { account_id: accountId };
    return this.client.post<{ account_id: UUID }>('/social/contents/refresh', requestData);
  }

  /**
   * Fetch historic content items from a specific date
   */
  async fetchHistoric(accountId: UUID, fromDate: string): Promise<{ account_id: UUID; from_date: string }> {
    const requestData: FetchHistoricRequest = { account_id: accountId, from_date: fromDate };
    return this.client.post<{ account_id: UUID; from_date: string }>('/social/contents/fetch-historic', requestData);
  }

  /**
   * Retrieve content items in bulk by IDs
   */
  async searchBulk(ids: UUID[]): Promise<ListResponse<Content>> {
    const requestData: BulkSearchRequest = { ids };
    return this.client.post<ListResponse<Content>>('/social/contents/search', requestData);
  }

  /**
   * Get all content items for an account (convenience method that handles pagination)
   */
  async getAllForAccount(accountId: UUID, fromDate?: string, toDate?: string): Promise<Content[]> {
    const allContents: Content[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const params: ContentsListParams = { 
        account_id: accountId, 
        limit, 
        offset,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate })
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
   * Get content items by date range
   */
  async getByDateRange(accountId: UUID, fromDate: string, toDate: string): Promise<Content[]> {
    const params: ContentsListParams = { 
      account_id: accountId, 
      from_date: fromDate, 
      to_date: toDate 
    };
    const response = await this.list(params);
    return response.data;
  }

  /**
   * Get recent content items (last 30 days)
   */
  async getRecent(accountId: UUID): Promise<Content[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    return this.getAllForAccount(accountId, fromDate);
  }
}