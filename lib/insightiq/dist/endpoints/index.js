"use strict";
// Endpoint implementations for InsightIQ AI API
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksEndpoint = exports.SocialListeningEndpoint = exports.PurchaseIntentEndpoint = exports.CommentsAnalyticsEndpoint = void 0;
var comments_analytics_1 = require("./comments-analytics");
Object.defineProperty(exports, "CommentsAnalyticsEndpoint", { enumerable: true, get: function () { return comments_analytics_1.CommentsAnalyticsEndpoint; } });
var purchase_intent_1 = require("./purchase-intent");
Object.defineProperty(exports, "PurchaseIntentEndpoint", { enumerable: true, get: function () { return purchase_intent_1.PurchaseIntentEndpoint; } });
var social_listening_1 = require("./social-listening");
Object.defineProperty(exports, "SocialListeningEndpoint", { enumerable: true, get: function () { return social_listening_1.SocialListeningEndpoint; } });
var webhooks_1 = require("./webhooks");
Object.defineProperty(exports, "WebhooksEndpoint", { enumerable: true, get: function () { return webhooks_1.WebhooksEndpoint; } });
