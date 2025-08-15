import type { InsightIQClient } from '../client';
import type {
  Content,
  ListResponse,
  ContentsListParams,
  BulkSearchRequest,
  UUID
} from '../types';

export class PublicationContentsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve a publication content item by ID
   */
  async get(id: UUID): Promise<Content> {
    return this.client.get<Content>(`/publications/contents/${id}`);
  }

  /**
   * List all publication content items with pagination and filtering
   */
  async list(params: ContentsListParams): Promise<ListResponse<Content>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<Content>>(`/publications/contents${queryString}`);
  }

  /**
   * Retrieve publication content items in bulk by IDs
   */
  async searchBulk(ids: UUID[]): Promise<ListResponse<Content>> {
    const requestData: BulkSearchRequest = { ids };
    return this.client.post<ListResponse<Content>>('/publications/contents/search', requestData);
  }

  /**
   * Get all publication content items for an account (convenience method that handles pagination)
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
   * Get publication content items by date range
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
}