import type { InsightIQClient } from '../client';
import type {
  CreateLinkRequest,
  LinkResponse
} from '../types';

export class LinksService {
  constructor(private client: InsightIQClient) {}

  /**
   * Create a connection link for account linking
   */
  async create(linkData: CreateLinkRequest): Promise<LinkResponse> {
    return this.client.post<LinkResponse>('/links', linkData);
  }
}