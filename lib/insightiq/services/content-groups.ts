import type { InsightIQClient } from '../client';
import type {
  ContentGroup,
  ListResponse,
  ContentGroupsListParams,
  RefreshRequest,
  FetchHistoricRequest,
  BulkSearchRequest,
  UUID
} from '../types';

export class ContentGroupsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve a content group by ID
   */
  async get(id: UUID): Promise<ContentGroup> {
    return this.client.get<ContentGroup>(`/social/content-groups/${id}`);
  }

  /**
   * List all content groups with pagination and filtering
   */
  async list(params: ContentGroupsListParams): Promise<ListResponse<ContentGroup>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<ContentGroup>>(`/social/content-groups${queryString}`);
  }

  /**
   * Refresh content groups for a connected account
   */
  async refresh(accountId: UUID): Promise<{ account_id: UUID }> {
    const requestData: RefreshRequest = { account_id: accountId };
    return this.client.post<{ account_id: UUID }>('/social/content-groups/refresh', requestData);
  }

  /**
   * Fetch historic content groups from a specific date
   */
  async fetchHistoric(accountId: UUID, fromDate: string): Promise<{ account_id: UUID; from_date: string }> {
    const requestData: FetchHistoricRequest = { account_id: accountId, from_date: fromDate };
    return this.client.post<{ account_id: UUID; from_date: string }>('/social/content-groups/fetch-historic', requestData);
  }

  /**
   * Retrieve content groups in bulk by IDs
   */
  async searchBulk(ids: UUID[]): Promise<ListResponse<ContentGroup>> {
    const requestData: BulkSearchRequest = { ids };
    return this.client.post<ListResponse<ContentGroup>>('/social/content-groups/search', requestData);
  }

  /**
   * Get all content groups for an account (convenience method that handles pagination)
   */
  async getAllForAccount(accountId: UUID, fromDate?: string, toDate?: string): Promise<ContentGroup[]> {
    const allContentGroups: ContentGroup[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const params: ContentGroupsListParams = { 
        account_id: accountId, 
        limit, 
        offset,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate })
      };
      
      const response = await this.list(params);
      allContentGroups.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allContentGroups;
  }

  /**
   * Get content groups by date range
   */
  async getByDateRange(accountId: UUID, fromDate: string, toDate: string): Promise<ContentGroup[]> {
    const params: ContentGroupsListParams = { 
      account_id: accountId, 
      from_date: fromDate, 
      to_date: toDate 
    };
    const response = await this.list(params);
    return response.data;
  }
}