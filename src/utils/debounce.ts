/**
 * Simple debounce function to delay execution.
 * @param fn The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export default function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void fn(...args);
    }, delay);
  };
}
