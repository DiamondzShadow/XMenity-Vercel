import type { InsightIQClient } from '../client';
import type {
  Comment,
  ListResponse,
  CommentsListParams,
  UUID
} from '../types';

export class CommentsService {
  constructor(private client: InsightIQClient) {}

  /**
   * List all comments with pagination and filtering
   */
  async list(params: CommentsListParams): Promise<ListResponse<Comment>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<Comment>>(`/social/comments${queryString}`);
  }

  /**
   * Get all comments for a content item (convenience method that handles pagination)
   */
  async getAllForContent(accountId: UUID, contentId: UUID, fromDate?: string, toDate?: string): Promise<Comment[]> {
    const allComments: Comment[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const params: CommentsListParams = { 
        account_id: accountId,
        content_id: contentId,
        limit, 
        offset,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate })
      };
      
      const response = await this.list(params);
      allComments.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allComments;
  }

  /**
   * Get comments by date range
   */
  async getByDateRange(accountId: UUID, contentId: UUID, fromDate: string, toDate: string): Promise<Comment[]> {
    const params: CommentsListParams = { 
      account_id: accountId,
      content_id: contentId,
      from_date: fromDate, 
      to_date: toDate 
    };
    const response = await this.list(params);
    return response.data;
  }

  /**
   * Get recent comments for a content item (last 30 days)
   */
  async getRecent(accountId: UUID, contentId: UUID): Promise<Comment[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    return this.getAllForContent(accountId, contentId, fromDate);
  }
}