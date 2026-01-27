/**
 * Utility functions for the application
 */

type ClassValue = string | undefined | null | false | ClassValue[];

/**
 * Combines class names, filtering out falsy values
 * Simple implementation that handles the common use cases
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' ');
}
