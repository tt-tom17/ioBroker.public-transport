declare module 'db-vendo-client' {
    import type { HafasClient, Profile } from 'hafas-client';

    // createClient hat die gleiche Signatur wie hafas-client
    export function createClient(profile: Profile, userAgent: string): HafasClient;
}

declare module 'db-vendo-client/p/dbnav/index.js' {
    import type { Profile } from 'hafas-client';
    export const profile: Profile;
}

declare module 'db-vendo-client/p/db/index.js' {
    import type { Profile } from 'hafas-client';
    export const profile: Profile;
}
