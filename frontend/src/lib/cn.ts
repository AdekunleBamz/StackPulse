/**
 * Class name value types for the cn utility.
 * Supports strings, numbers, null, undefined, and false values.
 */
type ClassValue = string | number | null | undefined | false;

/**
 * A lightweight className utility for conditionally joining CSS class names.
 * Filters out falsy values and joins the remaining classes with spaces.
 *
 * @param classNames - Any number of class name values (strings, numbers, null, undefined, false).
 * @returns A single string of joined class names.
 *
 * @example
 * ```ts
 * cn('foo', 'bar') // => 'foo bar'
 * cn('foo', null, 'bar') // => 'foo bar'
 * cn({ foo: true } && 'foo') // => 'foo'
 * ```
 */
export function cn(...classNames: ClassValue[]): string {
  return classNames.filter(Boolean).join(' ');
}
