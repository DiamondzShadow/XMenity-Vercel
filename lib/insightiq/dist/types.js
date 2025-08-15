"use strict";
// Type definitions for InsightIQ AI API
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisTimeoutError = exports.AnalysisFailedError = exports.APIError = exports.WebhookEvent = exports.ContentType = exports.ContentFormat = exports.CommentType = exports.Sentiment = exports.JobStatus = void 0;
// Common enums
var JobStatus;
(function (JobStatus) {
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["SUCCESS"] = "SUCCESS";
    JobStatus["FAILURE"] = "FAILURE";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var Sentiment;
(function (Sentiment) {
    Sentiment["POSITIVE"] = "POSITIVE";
    Sentiment["NEGATIVE"] = "NEGATIVE";
    Sentiment["NEUTRAL"] = "NEUTRAL";
})(Sentiment || (exports.Sentiment = Sentiment = {}));
var CommentType;
(function (CommentType) {
    CommentType["RELEVANT_COMMENTS"] = "RELEVANT_COMMENTS";
    CommentType["IRRELEVANT_COMMENTS"] = "IRRELEVANT_COMMENTS";
})(CommentType || (exports.CommentType = CommentType = {}));
var ContentFormat;
(function (ContentFormat) {
    ContentFormat["VIDEO"] = "VIDEO";
    ContentFormat["IMAGE"] = "IMAGE";
    ContentFormat["AUDIO"] = "AUDIO";
    ContentFormat["TEXT"] = "TEXT";
    ContentFormat["OTHER"] = "OTHER";
})(ContentFormat || (exports.ContentFormat = ContentFormat = {}));
var ContentType;
(function (ContentType) {
    ContentType["REELS"] = "REELS";
    ContentType["IGTV"] = "IGTV";
    ContentType["TWEET"] = "TWEET";
})(ContentType || (exports.ContentType = ContentType = {}));
// Webhook Types
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["ACCOUNTS_CONNECTED"] = "ACCOUNTS.CONNECTED";
    WebhookEvent["ACCOUNTS_DISCONNECTED"] = "ACCOUNTS.DISCONNECTED";
    WebhookEvent["PROFILES_ADDED"] = "PROFILES.ADDED";
    WebhookEvent["PROFILES_UPDATED"] = "PROFILES.UPDATED";
    WebhookEvent["PROFILES_AUDIENCE_ADDED"] = "PROFILES_AUDIENCE.ADDED";
    WebhookEvent["PROFILES_AUDIENCE_UPDATED"] = "PROFILES_AUDIENCE.UPDATED";
    WebhookEvent["CONTENTS_ADDED"] = "CONTENTS.ADDED";
    WebhookEvent["CONTENTS_UPDATED"] = "CONTENTS.UPDATED";
    WebhookEvent["CONTENTS_COMMENTS_ADDED"] = "CONTENTS_COMMENTS.ADDED";
    WebhookEvent["CONTENTS_COMMENTS_UPDATED"] = "CONTENTS_COMMENTS.UPDATED";
    WebhookEvent["CONTENT_GROUPS_ADDED"] = "CONTENT-GROUPS.ADDED";
    WebhookEvent["CONTENT_GROUPS_UPDATED"] = "CONTENT-GROUPS.UPDATED";
    WebhookEvent["TRANSACTIONS_ADDED"] = "TRANSACTIONS.ADDED";
    WebhookEvent["TRANSACTIONS_UPDATED"] = "TRANSACTIONS.UPDATED";
    WebhookEvent["PAYOUTS_ADDED"] = "PAYOUTS.ADDED";
    WebhookEvent["PAYOUTS_UPDATED"] = "PAYOUTS.UPDATED";
    WebhookEvent["BALANCES_ADDED"] = "BALANCES.ADDED";
    WebhookEvent["BALANCES_UPDATED"] = "BALANCES.UPDATED";
    WebhookEvent["CONTENTS_PUBLISH_SUCCESS"] = "CONTENTS.PUBLISH_SUCCESS";
    WebhookEvent["CONTENTS_PUBLISH_READY"] = "CONTENTS.PUBLISH_READY";
    WebhookEvent["CONTENTS_PUBLISH_FAILURE"] = "CONTENTS.PUBLISH_FAILURE";
    WebhookEvent["SESSION_EXPIRED"] = "SESSION.EXPIRED";
    WebhookEvent["ACTIVITY_ARTISTS_ADDED"] = "ACTIVITY-ARTISTS.ADDED";
    WebhookEvent["ACTIVITY_ARTISTS_UPDATED"] = "ACTIVITY-ARTISTS.UPDATED";
    WebhookEvent["ACTIVITY_CONTENTS_ADDED"] = "ACTIVITY-CONTENTS.ADDED";
    WebhookEvent["ACTIVITY_CONTENTS_UPDATED"] = "ACTIVITY-CONTENTS.UPDATED";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
// API Error Types
class APIError extends Error {
    constructor(message, status, details) {
        super(message);
        this.status = status;
        this.details = details;
        this.name = 'APIError';
    }
}
exports.APIError = APIError;
// Additional custom error types for better error handling
class AnalysisFailedError extends APIError {
    constructor(jobId, details) {
        super(`Analysis failed for job ${jobId}`, 422, details);
        this.name = 'AnalysisFailedError';
    }
}
exports.AnalysisFailedError = AnalysisFailedError;
class AnalysisTimeoutError extends APIError {
    constructor(jobId, timeout, details) {
        super(`Analysis timeout for job ${jobId} after ${timeout}ms`, 408, details);
        this.name = 'AnalysisTimeoutError';
    }
}
exports.AnalysisTimeoutError = AnalysisTimeoutError;
