import type { InsightIQClient } from '../client';
import type {
  Profile,
  ListResponse,
  ProfilesListParams,
  RefreshProfileRequest,
  UUID
} from '../types';

export class ProfilesService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve a profile by ID
   */
  async get(id: UUID): Promise<Profile> {
    return this.client.get<Profile>(`/profiles/${id}`);
  }

  /**
   * List all profiles with pagination and filtering
   */
  async list(params: ProfilesListParams = {}): Promise<ListResponse<Profile>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<Profile>>(`/profiles${queryString}`);
  }

  /**
   * Refresh a profile for a connected account
   */
  async refresh(accountId: UUID): Promise<{ account_id: UUID }> {
    const requestData: RefreshProfileRequest = { account_id: accountId };
    return this.client.post<{ account_id: UUID }>('/profiles/refresh', requestData);
  }

  /**
   * Get all profiles (convenience method that handles pagination)
   */
  async getAll(): Promise<Profile[]> {
    const allProfiles: Profile[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.list({ limit, offset });
      allProfiles.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allProfiles;
  }

  /**
   * Get profiles for a specific user
   */
  async getByUserId(userId: UUID): Promise<Profile[]> {
    const response = await this.list({ user_id: userId });
    return response.data;
  }

  /**
   * Get profiles for a specific work platform
   */
  async getByWorkPlatformId(workPlatformId: UUID): Promise<Profile[]> {
    const response = await this.list({ work_platform_id: workPlatformId });
    return response.data;
  }

  /**
   * Get profiles for a specific account
   */
  async getByAccountId(accountId: UUID): Promise<Profile[]> {
    const response = await this.list({ account_id: accountId });
    return response.data;
  }
}