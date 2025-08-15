// Base error class for all InsightIQ errors
export class InsightIQError extends Error {
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode?: number,
    requestId?: string,
    details?: any
  ) {
    super(message);
    this.name = 'InsightIQError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsightIQError);
    }
  }
}

// Authentication errors
export class AuthenticationError extends InsightIQError {
  constructor(message: string = 'Authentication failed', requestId?: string) {
    super(message, 401, requestId);
    this.name = 'AuthenticationError';
  }
}

// Authorization errors
export class AuthorizationError extends InsightIQError {
  constructor(message: string = 'Access denied', requestId?: string) {
    super(message, 403, requestId);
    this.name = 'AuthorizationError';
  }
}

// Not found errors
export class NotFoundError extends InsightIQError {
  constructor(message: string = 'Resource not found', requestId?: string) {
    super(message, 404, requestId);
    this.name = 'NotFoundError';
  }
}

// Validation errors
export class ValidationError extends InsightIQError {
  constructor(message: string = 'Validation failed', details?: any, requestId?: string) {
    super(message, 400, requestId, details);
    this.name = 'ValidationError';
  }
}

// Rate limit errors
export class RateLimitError extends InsightIQError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    requestId?: string
  ) {
    super(message, 429, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Server errors
export class ServerError extends InsightIQError {
  constructor(message: string = 'Internal server error', requestId?: string) {
    super(message, 500, requestId);
    this.name = 'ServerError';
  }
}

// Network errors
export class NetworkError extends InsightIQError {
  constructor(message: string = 'Network error occurred', originalError?: Error) {
    super(message, undefined, undefined, originalError);
    this.name = 'NetworkError';
  }
}

// Configuration errors
export class ConfigurationError extends InsightIQError {
  constructor(message: string = 'SDK configuration error') {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Request timeout errors
export class TimeoutError extends InsightIQError {
  constructor(message: string = 'Request timeout', timeout?: number) {
    super(message, 408, undefined, { timeout });
    this.name = 'TimeoutError';
  }
}

// Bad gateway errors
export class BadGatewayError extends InsightIQError {
  constructor(message: string = 'Bad gateway', requestId?: string) {
    super(message, 502, requestId);
    this.name = 'BadGatewayError';
  }
}

// Service unavailable errors
export class ServiceUnavailableError extends InsightIQError {
  constructor(message: string = 'Service unavailable', requestId?: string) {
    super(message, 503, requestId);
    this.name = 'ServiceUnavailableError';
  }
}

// Gateway timeout errors
export class GatewayTimeoutError extends InsightIQError {
  constructor(message: string = 'Gateway timeout', requestId?: string) {
    super(message, 504, requestId);
    this.name = 'GatewayTimeoutError';
  }
}

// Error factory function to create appropriate error types based on status codes
export function createErrorFromResponse(
  statusCode: number,
  message: string,
  requestId?: string,
  details?: any
): InsightIQError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, details, requestId);
    case 401:
      return new AuthenticationError(message, requestId);
    case 403:
      return new AuthorizationError(message, requestId);
    case 404:
      return new NotFoundError(message, requestId);
    case 408:
      return new TimeoutError(message);
    case 429:
      return new RateLimitError(message, undefined, requestId);
    case 500:
      return new ServerError(message, requestId);
    case 502:
      return new BadGatewayError(message, requestId);
    case 503:
      return new ServiceUnavailableError(message, requestId);
    case 504:
      return new GatewayTimeoutError(message, requestId);
    default:
      if (statusCode >= 500) {
        return new ServerError(message, requestId);
      } else if (statusCode >= 400) {
        return new ValidationError(message, details, requestId);
      }
      return new InsightIQError(message, statusCode, requestId, details);
  }
}

// Type guard functions
export function isInsightIQError(error: any): error is InsightIQError {
  return error instanceof InsightIQError;
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: any): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isRateLimitError(error: any): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isServerError(error: any): error is ServerError {
  return error instanceof ServerError;
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}