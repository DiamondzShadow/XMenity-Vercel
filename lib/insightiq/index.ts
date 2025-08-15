export { InsightIQClient } from './client';
export * from './types';
export * from './errors';

// Re-export all service classes
export { UsersService } from './services/users';
export { AccountsService } from './services/accounts';
export { TokensService } from './services/tokens';
export { LinksService } from './services/links';
export { WorkPlatformsService } from './services/work-platforms';
export { ProfilesService } from './services/profiles';
export { AudienceService } from './services/audience';

// Default export
export { InsightIQClient as default } from './client';