import { Temporal } from "temporal-polyfill";
/**
 * Parses an HTTP date string (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`) into a `Temporal.Instant`.
 * The date string must be in the format specified by RFC 7231.
 *
 * @param httpDate - The HTTP date string to parse.
 * @throws {RangeError} If the date string is invalid or cannot be parsed.
 * @returns The parsed `Temporal.Instant`.
 */
export declare function parseHttpDate(httpDate: string): Temporal.Instant;
/**
 * Formats a `Temporal.Instant` into an HTTP date string (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`).
 * The date string is formatted according to RFC 7231.
 *
 * @param instant - The `Temporal.Instant` to format.
 * @returns The formatted HTTP date string.
 */
export declare function formatHttpDate(instant: Temporal.Instant): string;
/**
 * Converts a `Temporal.Duration` to a number of seconds.
 * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
 * point to calculate the total number of seconds.
 *
 * WARNING: If the total number of seconds is larger than the maximum safe integer in JavaScript, this method will
 * lose precision. @see durationTotalSecondsBigInt for a BigInt alternative.
 *
 * @param duration - the duration to calculate the total number of seconds for
 * @returns the total number of seconds in the duration
 */
export declare function durationTotalSeconds(duration: Temporal.Duration): number;
/**
 * Gets the total number of seconds in a duration.
 *
 * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
 * point to calculate the total number of seconds. It will also throw an error if any of the components are not integers.
 *
 * @param duration - the duration to calculate the total number of seconds for
 * @returns the total number of seconds in the duration
 */
export declare function durationTotalSecondsBigInt(duration: Temporal.Duration): bigint;
