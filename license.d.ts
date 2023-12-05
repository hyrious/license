/**
 * Get common licenses information
 * @returns Full name (e.g. "Apache License 2.0") and short name (e.g. "Apache-2.0") and url to get the full text.
 */
export declare function licenses(): Promise<{ name: string, spdx_id: string, url: string }[]>;

/**
 * Get full text of a license, returns undefined if not found the key.
 * @param key License key, e.g. "mit"
 * @param replacement `{ fullname: 'foo' }` => replaces `[fullname]` in the text with `foo`. It by default includes `[year]` &rarr; current year. 
 */
export declare function license(key: string, replacement?: { [key: string]: string }): Promise<string | undefined>;
