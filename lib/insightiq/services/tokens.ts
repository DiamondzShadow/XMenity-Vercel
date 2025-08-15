import type { InsightIQClient } from '../client';
import type {
  CreateSDKTokenRequest,
  SDKTokenResponse
} from '../types';

export class TokensService {
  constructor(private client: InsightIQClient) {}

  /**
   * Create an SDK token for Connect SDK initialization
   */
  async createSDKToken(tokenData: CreateSDKTokenRequest): Promise<SDKTokenResponse> {
    return this.client.post<SDKTokenResponse>('/sdk-tokens', tokenData);
  }
}