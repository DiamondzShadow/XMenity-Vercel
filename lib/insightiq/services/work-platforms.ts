import type { InsightIQClient } from '../client';
import type {
  WorkPlatform,
  ListResponse,
  WorkPlatformsListParams,
  UUID
} from '../types';

export class WorkPlatformsService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve a work platform by ID
   */
  async get(id: UUID): Promise<WorkPlatform> {
    return this.client.get<WorkPlatform>(`/work-platforms/${id}`);
  }

  /**
   * List all work platforms with pagination and filtering
   */
  async list(params: WorkPlatformsListParams = {}): Promise<ListResponse<WorkPlatform>> {
    const queryString = this.client.buildQueryString(params);
    return this.client.get<ListResponse<WorkPlatform>>(`/work-platforms${queryString}`);
  }

  /**
   * Get all work platforms (convenience method that handles pagination)
   */
  async getAll(): Promise<WorkPlatform[]> {
    const allPlatforms: WorkPlatform[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.list({ limit, offset });
      allPlatforms.push(...response.data);
      
      if (response.data.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return allPlatforms;
  }

  /**
   * Find work platforms by name
   */
  async findByName(name: string): Promise<WorkPlatform[]> {
    const response = await this.list({ name });
    return response.data;
  }
}