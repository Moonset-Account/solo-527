declare function route(name: string, params?: Record<string, string | number>): string;

declare function routeWithQuery(
    name: string,
    params?: Record<string, string | number>,
    query?: Record<string, any>,
): string;

export {};
