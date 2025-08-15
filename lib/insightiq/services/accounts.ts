import type { InsightIQClient } from '../client';
import type {
  Account,
  ListResponse,
  AccountsListParams,
  UUID
} from '../types';

export class AccountsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve an account by ID
   */
  async get(id: UUID): Promise<Account> {
    return this.client.get<Account>(`/accounts/${id}`);
  }

  /**
   * List all accounts with pagination and filtering
   */
  async list(params: AccountsListParams = {}): Promise<ListResponse<Account>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<Account>>(`/accounts${queryString}`);
  }

  /**
   * Disconnect an account
   */
  async disconnect(id: UUID): Promise<Account> {
    return this.client.post<Account>(`/accounts/${id}/disconnect`, {});
  }

  /**
   * Get all accounts (convenience method that handles pagination)
   */
  async getAll(): Promise<Account[]> {
    const allAccounts: Account[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.list({ limit, offset });
      allAccounts.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allAccounts;
  }

  /**
   * Get accounts for a specific user
   */
  async getByUserId(userId: UUID): Promise<Account[]> {
    const response = await this.list({ user_id: userId });
    return response.data;
  }

  /**
   * Get accounts for a specific work platform
   */
  async getByWorkPlatformId(workPlatformId: UUID): Promise<Account[]> {
    const response = await this.list({ work_platform_id: workPlatformId });
    return response.data;
  }
}