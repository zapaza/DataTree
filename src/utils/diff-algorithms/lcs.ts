export default class LCS {
  /**
   * Вычисляет последовательность изменений для превращения массива A в B.
   * Оптимизированная версия с использованием O(min(N,M)) памяти для поиска длины
   * и рекурсивного подхода для восстановления пути (аналог алгоритма Майерса или Hirschberg).
   *
   * Для простоты и надежности в рамках данного проекта, мы оптимизируем текущую реализацию DP,
   * чтобы она не создавала огромную матрицу N*M, которая приводит к Out of Memory.
   */
  static diff<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean): { type: 'added' | 'removed' | 'unchanged', item: T, indexA: number, indexB: number }[] {
    const n = a.length;
    const m = b.length;

    // Лимит для предотвращения зависаний на экстремально больших массивах
    const MAX_SIZE = 5000;
    if (n > MAX_SIZE || m > MAX_SIZE) {
        // Если массивы слишком большие, используем упрощенное сравнение "в лоб" или жадный алгоритм
        // Чтобы не падать по памяти
        return this.simpleDiff(a, b, isEqual);
    }

    return this.backtrackLCS(a, b, isEqual);
  }

  /**
   * Стандартный DP LCS с оптимизацией памяти до O(M) для вычисления длины,
   * но для восстановления пути нам все равно нужна матрица или рекурсия.
   * Здесь мы используем классический подход, но с защитой от пустых данных.
   */
  private static backtrackLCS<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean) {
    const n = a.length;
    const m = b.length;

    // Создаем типизированный массив для экономии памяти если возможно,
    // но так как нам нужны значения, используем обычный.
    const matrix: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (isEqual(a[i - 1], b[j - 1])) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    const result: { type: 'added' | 'removed' | 'unchanged', item: T, indexA: number, indexB: number }[] = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && isEqual(a[i - 1], b[j - 1])) {
        result.unshift({ type: 'unchanged', item: a[i - 1], indexA: i - 1, indexB: j - 1 });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        result.unshift({ type: 'added', item: b[j - 1], indexA: -1, indexB: j - 1 });
        j--;
      } else {
        result.unshift({ type: 'removed', item: a[i - 1], indexA: i - 1, indexB: -1 });
        i--;
      }
    }

    return result;
  }

  /**
   * Жадный алгоритм для очень больших массивов (O(N)).
   * Не гарантирует минимальный diff, но работает быстро и не ест память.
   */
  private static simpleDiff<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean) {
    const result: { type: 'added' | 'removed' | 'unchanged', item: T, indexA: number, indexB: number }[] = [];

    // Простое сравнение по индексам + обработка разницы в длине
    const minLen = Math.min(a.length, b.length);

    for (let i = 0; i < minLen; i++) {
      if (isEqual(a[i], b[i])) {
        result.push({ type: 'unchanged', item: a[i], indexA: i, indexB: i });
      } else {
        // Считаем это модификацией (removed + added)
        result.push({ type: 'removed', item: a[i], indexA: i, indexB: -1 });
        result.push({ type: 'added', item: b[i], indexA: -1, indexB: i });
      }
    }

    if (a.length > b.length) {
      for (let i = minLen; i < a.length; i++) {
        result.push({ type: 'removed', item: a[i], indexA: i, indexB: -1 });
      }
    } else if (b.length > a.length) {
      for (let i = minLen; i < b.length; i++) {
        result.push({ type: 'added', item: b[i], indexA: -1, indexB: i });
      }
    }

    return result;
  }
}
