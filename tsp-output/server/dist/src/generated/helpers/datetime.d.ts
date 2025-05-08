/**
 * A duration of time, measured in years, months, weeks, days, hours, minutes, and seconds.
 *
 * The values may be fractional and are not normalized (e.g. 36 hours is not the same duration as 1 day and 12 hours
 * when accounting for Daylight Saving Time changes or leap seconds).
 *
 * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
 */
export interface Duration {
    /**
     * "+" if the duration is positive, "-" if the duration is negative.
     */
    sign: "+" | "-";
    /**
     * The number of years in the duration.
     */
    years: number;
    /**
     * The number of months in the duration.
     */
    months: number;
    /**
     * The number of weeks in the duration.
     */
    weeks: number;
    /**
     * The number of days in the duration.
     */
    days: number;
    /**
     * The number of hours in the duration.
     */
    hours: number;
    /**
     * The number of minutes in the duration.
     */
    minutes: number;
    /**
     * The number of seconds in the duration.
     */
    seconds: number;
}
export declare const Duration: Readonly<{
    /**
     * Parses an ISO8601 duration string into an object.
     *
     * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
     *
     * @param duration - the duration string to parse
     * @returns an object containing the parsed duration
     */
    parseISO8601(duration: string, maxLength?: number): Duration;
    /**
     * Writes a Duration to an ISO8601 duration string.
     *
     * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
     *
     * @param duration - the duration to write to a string
     * @returns a string in ISO8601 duration format
     */
    toISO8601(duration: Duration): string;
    /**
     * Gets the total number of seconds in a duration.
     *
     * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
     * point to calculate the total number of seconds.
     *
     * WARNING: If the total number of seconds is larger than the maximum safe integer in JavaScript, this method will
     * lose precision. @see Duration.totalSecondsBigInt for a BigInt alternative.
     *
     * @param duration - the duration to calculate the total number of seconds for
     * @returns the total number of seconds in the duration
     */
    totalSeconds(duration: Duration): number;
    /**
     * Gets the total number of seconds in a duration.
     *
     * This method will throw an Error if the duration contains any years, months, weeks, or days, as those require a reference
     * point to calculate the total number of seconds. It will also throw an error if any of the components are not integers.
     *
     * @param duration - the duration to calculate the total number of seconds for
     * @returns the total number of seconds in the duration
     */
    totalSecondsBigInt(duration: Duration): bigint;
    /**
     * Creates a duration from a total number of seconds.
     *
     * The result is not normalized, so it will only contain a seconds field.
     */
    fromTotalSeconds(seconds: number): Duration;
}>;
