declare module '@motis-project/motis-fptf-client' {
    import type { HafasClient, Profile } from 'hafas-client';

    export function createClient(profile: Profile, userAgent: string): HafasClient;
}

declare module '@motis-project/motis-fptf-client/p/transitous/index.js' {
    import type { Profile } from 'hafas-client';
    export const profile: Profile;
}

declare module '@motis-project/motis-fptf-client/p/compat/index.js' {
    import type { Profile } from 'hafas-client';
    export const profile: Profile;
}

declare module '@motis-project/motis-fptf-client/throttle.js' {
    import type { Profile } from 'hafas-client';
    export function withThrottling(profile: Profile, limit?: number, interval?: number): Profile;
}
