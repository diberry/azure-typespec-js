export interface HeaderValueParameters {
    value: string;
    verbatim: string;
    params: {
        [k: string]: string;
    };
}
/**
 * Parses a header value that may contain additional parameters (e.g. `text/html; charset=utf-8`).
 * @param headerValueText - the text of the header value to parse
 * @returns an object containing the value and a map of parameters
 */
export declare function parseHeaderValueParameters<Header extends string | undefined>(headerValueText: Header): undefined extends Header ? HeaderValueParameters | undefined : HeaderValueParameters;
