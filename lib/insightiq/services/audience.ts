import type { InsightIQClient } from '../client';
import type {
  AudienceDemographics,
  AudienceParams,
  UUID
} from '../types';

export class AudienceService {
  constructor(private client: InsightIQClient) {}

  /**
   * Retrieve audience demographics for a connected account
   */
  async getDemographics(accountId: UUID): Promise<AudienceDemographics> {
    const params: AudienceParams = { account_id: accountId };
    const queryString = this.client.buildQueryString(params);
    return this.client.get<AudienceDemographics>(`/audience${queryString}`);
  }
}