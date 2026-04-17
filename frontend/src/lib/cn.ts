/**
 * Class name value types for the cn utility.
 * Supports strings, numbers, null, undefined, false values, and object maps.
 */
type ClassValue = string | number | null | undefined | false | Record<string, boolean | undefined>;

/**
 * A lightweight className utility for conditionally joining CSS class names.
 * Filters out falsy values, expands object maps, and joins the remaining classes with spaces.
 *
 * @param classNames - Any number of class name values (strings, numbers, null, undefined, false, or object maps).
 * @returns A single string of joined class names.
 *
 * @example
 * ```ts
 * cn('foo', 'bar') // => 'foo bar'
 * cn('foo', null, 'bar') // => 'foo bar'
 * cn({ active: true, disabled: false }) // => 'active'
 * ```
 */
export function cn(...classNames: ClassValue[]): string {
  return classNames
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);
      }
      return [cls];
    })
    .join(' ');
}
