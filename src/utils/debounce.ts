/**
 * Simple debounce function to delay execution.
 * @param fn The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export default function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as T;
}
