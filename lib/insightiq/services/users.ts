import type { InsightIQClient } from '../client';
import type {
  User,
  CreateUserRequest,
  ListResponse,
  UsersListParams,
  UUID
} from '../types';

export class UsersService {
  constructor(private client: InsightIQClient) {}

  /**
   * Create a new user
   */
  async create(userData: CreateUserRequest): Promise<User> {
    return this.client.post<User>('/users', userData);
  }

  /**
   * Retrieve a user by ID
   */
  async get(id: UUID): Promise<User> {
    return this.client.get<User>(`/users/${id}`);
  }

  /**
   * Retrieve a user by external ID
   */
  async getByExternalId(externalId: string): Promise<User> {
    return this.client.get<User>(`/users/external_id/${externalId}`);
  }

  /**
   * List all users with pagination
   */
  async list(params: UsersListParams = {}): Promise<ListResponse<User>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<User>>(`/users${queryString}`);
  }

  /**
   * Get all users (convenience method that handles pagination)
   */
  async getAll(): Promise<User[]> {
    const allUsers: User[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.list({ limit, offset });
      allUsers.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allUsers;
  }
}