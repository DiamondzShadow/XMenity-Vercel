"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksEndpoint = void 0;
class WebhooksEndpoint {
    constructor(request) {
        this.request = request;
    }
    /**
     * Create a webhook
     * POST /webhooks
     */
    async create(data) {
        return this.request('/webhooks', 'POST', data);
    }
    /**
     * Retrieve a webhook
     * GET /webhooks/{id}
     */
    async get(id) {
        return this.request(`/webhooks/${id}`);
    }
    /**
     * Update a webhook
     * PUT /webhooks/{id}
     */
    async update(id, data) {
        return this.request(`/webhooks/${id}`, 'PUT', data);
    }
    /**
     * Delete a webhook
     * DELETE /webhooks/{id}
     */
    async delete(id) {
        await this.request(`/webhooks/${id}`, 'DELETE');
    }
    /**
     * Retrieve all webhooks
     * GET /webhooks
     */
    async list(params = {}) {
        return this.request('/webhooks', 'GET', undefined, params);
    }
    /**
     * Get all webhooks (paginated)
     * Automatically handles pagination to retrieve all webhooks
     * @warning This method loads ALL webhooks into memory.
     * For large numbers of webhooks, this may cause performance issues.
     */
    async getAll(options = {}) {
        const batchSize = Math.min(options.batchSize || 100, 100);
        const maxWebhooks = options.maxWebhooks || Infinity;
        let allWebhooks = [];
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
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    async findByUrl(urlPattern) {
        const allWebhooks = await this.getAll();
        return allWebhooks.filter(webhook => webhook.url.includes(urlPattern));
    }
    /**
     * Find webhooks by event type
     * Filters webhooks that listen to specific event types
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    async findByEvent(eventType) {
        const allWebhooks = await this.getAll();
        return allWebhooks.filter(webhook => webhook.events.includes(eventType));
    }
    /**
     * Find active webhooks
     * Returns only active webhooks
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    async findActive() {
        const allWebhooks = await this.getAll();
        return allWebhooks.filter(webhook => webhook.is_active);
    }
    /**
     * Find inactive webhooks
     * Returns only inactive webhooks
     * @warning This method fetches ALL webhooks and filters client-side.
     * For large numbers of webhooks, this may cause performance issues.
     */
    async findInactive() {
        const allWebhooks = await this.getAll();
        return allWebhooks.filter(webhook => !webhook.is_active);
    }
    /**
     * Disable a webhook
     * Sets a webhook to inactive without deleting it
     */
    async disable(id) {
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
    async enable(id) {
        const webhook = await this.get(id);
        return this.update(id, {
            ...webhook,
            is_active: true
        });
    }
    /**
     * Disable all webhooks
     * Sets all webhooks to inactive
     * @warning This method is NOT atomic and may trigger API rate limits.
     * If some requests fail, the system will be left in an inconsistent state.
     * Use with caution and consider implementing retry logic.
     */
    async disableAll(options = {}) {
        const batchSize = options.batchSize || 5;
        const delay = options.delayBetweenBatches || 1000;
        const allWebhooks = await this.getAll();
        const activeWebhooks = allWebhooks.filter(webhook => webhook.is_active);
        const results = [];
        // Process in batches to avoid rate limiting
        for (let i = 0; i < activeWebhooks.length; i += batchSize) {
            const batch = activeWebhooks.slice(i, i + batchSize);
            const batchPromises = batch.map(webhook => this.update(webhook.id, {
                ...webhook,
                is_active: false
            }));
            try {
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                // Add delay between batches (except for the last batch)
                if (i + batchSize < activeWebhooks.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                console.error(`Batch ${i / batchSize + 1} failed:`, error);
                throw error; // Re-throw to maintain original behavior
            }
        }
        return results;
    }
    /**
     * Enable all webhooks
     * Sets all webhooks to active
     * @warning This method is NOT atomic and may trigger API rate limits.
     * If some requests fail, the system will be left in an inconsistent state.
     * Use with caution and consider implementing retry logic.
     */
    async enableAll(options = {}) {
        const batchSize = options.batchSize || 5;
        const delay = options.delayBetweenBatches || 1000;
        const allWebhooks = await this.getAll();
        const inactiveWebhooks = allWebhooks.filter(webhook => !webhook.is_active);
        const results = [];
        // Process in batches to avoid rate limiting
        for (let i = 0; i < inactiveWebhooks.length; i += batchSize) {
            const batch = inactiveWebhooks.slice(i, i + batchSize);
            const batchPromises = batch.map(webhook => this.update(webhook.id, {
                ...webhook,
                is_active: true
            }));
            try {
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                // Add delay between batches (except for the last batch)
                if (i + batchSize < inactiveWebhooks.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                console.error(`Batch ${i / batchSize + 1} failed:`, error);
                throw error; // Re-throw to maintain original behavior
            }
        }
        return results;
    }
}
exports.WebhooksEndpoint = WebhooksEndpoint;
