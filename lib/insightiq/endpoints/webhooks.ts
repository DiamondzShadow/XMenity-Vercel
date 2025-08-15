import {
  WebhookRequest,
  WebhookResponse,
  WebhookUpdateRequest,
  WebhooksListResponse,
  PaginationParams
} from '../types';

export class WebhooksEndpoint {
  constructor(private request: <T>(
    endpoint: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    queryParams?: Record<string, string | number | boolean>
  ) => Promise<T>) {}

  /**
   * Create a webhook
   * POST /webhooks
   */
  async create(data: WebhookRequest): Promise<WebhookResponse> {
    return this.request<WebhookResponse>(
      '/webhooks',
      'POST',
      data
    );
  }

  /**
   * Retrieve a webhook
   * GET /webhooks/{id}
   */
  async get(id: string): Promise<WebhookResponse> {
    return this.request<WebhookResponse>(
      `/webhooks/${id}`
    );
  }

  /**
   * Update a webhook
   * PUT /webhooks/{id}
   */
  async update(id: string, data: WebhookUpdateRequest): Promise<WebhookResponse> {
    return this.request<WebhookResponse>(
      `/webhooks/${id}`,
      'PUT',
      data
    );
  }

  /**
   * Delete a webhook
   * DELETE /webhooks/{id}
   */
  async delete(id: string): Promise<void> {
    await this.request<void>(
      `/webhooks/${id}`,
      'DELETE'
    );
  }

  /**
   * Retrieve all webhooks
   * GET /webhooks
   */
  async list(params: PaginationParams = {}): Promise<WebhooksListResponse> {
    return this.request<WebhooksListResponse>(
      '/webhooks',
      'GET',
      undefined,
      params
    );
  }

  /**
   * Get all webhooks (paginated)
   * Automatically handles pagination to retrieve all webhooks
   */
  async getAll(options: {
    batchSize?: number; // default 100 (max allowed)
    maxWebhooks?: number; // default unlimited
  } = {}): Promise<WebhookResponse[]> {
    const batchSize = Math.min(options.batchSize || 100, 100);
    const maxWebhooks = options.maxWebhooks || Infinity;
    let allWebhooks: WebhookResponse[] = [];
    let offset = 0;

    while (allWebhooks.length < maxWebhooks) {
      const response = await this.list({
        limit: Math.min(batchSize, maxWebhooks - allWebhooks.length),
        offset
      });

      if (response.data.length === 0) {
        break; // No more webhooks
      }

      allWebhooks = allWebhooks.concat(response.data);
      offset += response.data.length;

      // If we got fewer webhooks than requested, we've reached the end
      if (response.data.length < batchSize) {
        break;
      }
    }

    return allWebhooks;
  }

  /**
   * Find webhooks by URL
   * Filters webhooks by URL pattern
   */
  async findByUrl(urlPattern: string): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    return allWebhooks.filter(webhook => 
      webhook.url.includes(urlPattern)
    );
  }

  /**
   * Find webhooks by event type
   * Filters webhooks that listen to specific event types
   */
  async findByEvent(eventType: string): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    return allWebhooks.filter(webhook => 
      webhook.events.includes(eventType as any)
    );
  }

  /**
   * Find active webhooks
   * Returns only active webhooks
   */
  async findActive(): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    return allWebhooks.filter(webhook => webhook.is_active);
  }

  /**
   * Find inactive webhooks
   * Returns only inactive webhooks
   */
  async findInactive(): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    return allWebhooks.filter(webhook => !webhook.is_active);
  }

  /**
   * Disable a webhook
   * Sets a webhook to inactive without deleting it
   */
  async disable(id: string): Promise<WebhookResponse> {
    const webhook = await this.get(id);
    return this.update(id, {
      ...webhook,
      is_active: false
    });
  }

  /**
   * Enable a webhook
   * Sets a webhook to active
   */
  async enable(id: string): Promise<WebhookResponse> {
    const webhook = await this.get(id);
    return this.update(id, {
      ...webhook,
      is_active: true
    });
  }

  /**
   * Disable all webhooks
   * Sets all webhooks to inactive
   */
  async disableAll(): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    const activeWebhooks = allWebhooks.filter(webhook => webhook.is_active);
    
    const updatePromises = activeWebhooks.map(webhook =>
      this.update(webhook.id, {
        ...webhook,
        is_active: false
      })
    );
    
    return Promise.all(updatePromises);
  }

  /**
   * Enable all webhooks
   * Sets all webhooks to active
   */
  async enableAll(): Promise<WebhookResponse[]> {
    const allWebhooks = await this.getAll();
    const inactiveWebhooks = allWebhooks.filter(webhook => !webhook.is_active);
    
    const updatePromises = inactiveWebhooks.map(webhook =>
      this.update(webhook.id, {
        ...webhook,
        is_active: true
      })
    );
    
    return Promise.all(updatePromises);
  }
}