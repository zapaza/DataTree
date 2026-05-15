type TLcsOperation<T> = {
  type: 'added' | 'removed' | 'unchanged';
  item: T;
  indexA: number;
  indexB: number;
};

export default class LCS {
  /**
   * Вычисляет последовательность изменений для превращения массива A в B.
   * Оптимизированная версия с использованием O(min(N,M)) памяти для поиска длины
   * и рекурсивного подхода для восстановления пути (аналог алгоритма Майерса или Hirschberg).
   *
   * Для простоты и надежности в рамках данного проекта, мы оптимизируем текущую реализацию DP,
   * чтобы она не создавала огромную матрицу N*M, которая приводит к Out of Memory.
   */
  static diff<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean): TLcsOperation<T>[] {
    const n = a.length;
    const m = b.length;

    // Лимиты для предотвращения зависаний на больших массивах и широких DP-матрицах.
    const MAX_SIZE = 5000;
    const MAX_MATRIX_CELLS = 1_000_000;
    const MAX_MYERS_EDIT_DISTANCE = 1000;
    if (n > MAX_SIZE || m > MAX_SIZE) {
      return this.simpleDiff(a, b, isEqual);
    }

    if ((n + 1) * (m + 1) > MAX_MATRIX_CELLS) {
      return this.myersDiff(a, b, isEqual, MAX_MYERS_EDIT_DISTANCE)
        ?? this.simpleDiff(a, b, isEqual);
    }

    return this.backtrackLCS(a, b, isEqual);
  }

  /**
   * Стандартный DP LCS с оптимизацией памяти до O(M) для вычисления длины,
   * но для восстановления пути нам все равно нужна матрица или рекурсия.
   * Здесь мы используем классический подход, но с защитой от пустых данных.
   */
  private static backtrackLCS<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean): TLcsOperation<T>[] {
    const n = a.length;
    const m = b.length;

    // Создаем типизированный массив для экономии памяти если возможно,
    // но так как нам нужны значения, используем обычный.
    const matrix: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const itemA = a[i - 1]!;
        const itemB = b[j - 1]!;
        if (isEqual(itemA, itemB)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]! + 1;
        } else {
          matrix[i]![j] = Math.max(matrix[i - 1]![j]!, matrix[i]![j - 1]!);
        }
      }
    }

    const result: TLcsOperation<T>[] = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
      const itemA = i > 0 ? a[i - 1]! : undefined;
      const itemB = j > 0 ? b[j - 1]! : undefined;

      if (i > 0 && j > 0 && itemA !== undefined && itemB !== undefined && isEqual(itemA, itemB)) {
        result.push({ type: 'unchanged', item: itemA, indexA: i - 1, indexB: j - 1 });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i]![j - 1]! >= matrix[i - 1]![j]!)) {
        result.push({ type: 'added', item: itemB!, indexA: -1, indexB: j - 1 });
        j--;
      } else if (i > 0) {
        result.push({ type: 'removed', item: itemA!, indexA: i - 1, indexB: -1 });
        i--;
      } else {
        break;
      }
    }

    return result.reverse();
  }

  /**
   * Myers edit script для средних массивов с небольшим edit distance.
   * Память O(N+M), а maxDistance ограничивает худшие случаи, где лучше
   * быстро отступить к approximate diff, чем блокировать worker надолго.
   */
  private static myersDiff<T>(
    a: T[],
    b: T[],
    isEqual: (x: T, y: T) => boolean,
    maxDistance: number
  ): TLcsOperation<T>[] | null {
    const n = a.length;
    const m = b.length;
    const max = Math.min(n + m, maxDistance);
    let frontier = new Map<number, number>([[1, 0]]);
    const trace: Array<Map<number, number>> = [];

    for (let distance = 0; distance <= max; distance++) {
      trace.push(new Map(frontier));
      const nextFrontier = new Map(frontier);

      for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
        const fromDeletion = frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY;
        const fromInsertion = frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY;
        let x: number;

        if (diagonal === -distance || (diagonal !== distance && fromDeletion < fromInsertion)) {
          x = fromInsertion;
        } else {
          x = fromDeletion + 1;
        }

        if (!Number.isFinite(x) || x < 0) x = 0;
        let y = x - diagonal;

        while (x < n && y < m && y >= 0 && isEqual(a[x]!, b[y]!)) {
          x++;
          y++;
        }

        nextFrontier.set(diagonal, x);

        if (x >= n && y >= m) {
          return this.backtrackMyers(a, b, trace, distance);
        }
      }

      frontier = nextFrontier;
    }

    return null;
  }

  private static backtrackMyers<T>(
    a: T[],
    b: T[],
    trace: Array<Map<number, number>>,
    editDistance: number
  ): TLcsOperation<T>[] {
    const result: TLcsOperation<T>[] = [];
    let x = a.length;
    let y = b.length;

    for (let distance = editDistance; distance >= 0; distance--) {
      const frontier = trace[distance];
      if (!frontier) break;

      const diagonal = x - y;
      const fromDeletion = frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY;
      const fromInsertion = frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY;
      const previousDiagonal = diagonal === -distance || (diagonal !== distance && fromDeletion < fromInsertion)
        ? diagonal + 1
        : diagonal - 1;
      const previousX = frontier.get(previousDiagonal) ?? 0;
      const previousY = previousX - previousDiagonal;

      while (x > previousX && y > previousY) {
        x--;
        y--;
        result.push({ type: 'unchanged', item: a[x]!, indexA: x, indexB: y });
      }

      if (distance === 0) break;

      if (x === previousX) {
        y--;
        result.push({ type: 'added', item: b[y]!, indexA: -1, indexB: y });
      } else {
        x--;
        result.push({ type: 'removed', item: a[x]!, indexA: x, indexB: -1 });
      }
    }

    return result.reverse();
  }

  /**
   * Жадный алгоритм для очень больших массивов (O(N)).
   * Не гарантирует минимальный diff, но работает быстро и не ест память.
   */
  private static simpleDiff<T>(a: T[], b: T[], isEqual: (x: T, y: T) => boolean): TLcsOperation<T>[] {
    const result: TLcsOperation<T>[] = [];

    // Простое сравнение по индексам + обработка разницы в длине
    const minLen = Math.min(a.length, b.length);

    for (let i = 0; i < minLen; i++) {
      const itemA = a[i]!;
      const itemB = b[i]!;
      if (isEqual(itemA, itemB)) {
        result.push({ type: 'unchanged', item: itemA, indexA: i, indexB: i });
      } else {
        // Считаем это модификацией (removed + added)
        result.push({ type: 'removed', item: itemA, indexA: i, indexB: -1 });
        result.push({ type: 'added', item: itemB, indexA: -1, indexB: i });
      }
    }

    if (a.length > b.length) {
      for (let i = minLen; i < a.length; i++) {
        result.push({ type: 'removed', item: a[i]!, indexA: i, indexB: -1 });
      }
    } else if (b.length > a.length) {
      for (let i = minLen; i < b.length; i++) {
        result.push({ type: 'added', item: b[i]!, indexA: -1, indexB: i });
      }
    }

    return result;
  }
}
