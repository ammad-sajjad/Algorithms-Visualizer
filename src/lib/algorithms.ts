// Step-based algorithm engine. Each algo returns a list of steps describing
// the visual state transitions. The visualizer plays back these steps.

export type StepType = "compare" | "swap" | "overwrite" | "pivot" | "markSorted" | "rangeHighlight";

export interface Step {
  type: StepType;
  indices: number[];      // indices involved
  values?: number[];      // for "overwrite" — new values to set at indices
  range?: [number, number]; // for rangeHighlight (merge sort sub-arrays)
  pivot?: number;
  description: string;
}

// ---------- Bubble Sort ----------
export function bubbleSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: "compare", indices: [j, j + 1], description: `Compare a[${j}] (${a[j]}) and a[${j + 1}] (${a[j + 1]})` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ type: "swap", indices: [j, j + 1], values: [a[j], a[j + 1]], description: `Swap → a[${j}]=${a[j]}, a[${j + 1}]=${a[j + 1]}` });
      }
    }
    steps.push({ type: "markSorted", indices: [n - i - 1], description: `Mark index ${n - i - 1} as sorted` });
  }
  steps.push({ type: "markSorted", indices: [0], description: "Array fully sorted" });
  return steps;
}

// ---------- Quick Sort ----------
export function quickSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];

  function qs(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) steps.push({ type: "markSorted", indices: [lo], description: `Single element a[${lo}] is sorted` });
      return;
    }
    const pivot = a[hi];
    steps.push({ type: "pivot", indices: [hi], pivot, description: `Choose pivot a[${hi}] = ${pivot}` });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      steps.push({ type: "compare", indices: [j, hi], description: `Compare a[${j}] (${a[j]}) with pivot ${pivot}` });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({ type: "swap", indices: [i, j], values: [a[i], a[j]], description: `Swap a[${i}] and a[${j}]` });
        }
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    steps.push({ type: "swap", indices: [i + 1, hi], values: [a[i + 1], a[hi]], description: `Place pivot at index ${i + 1}` });
    steps.push({ type: "markSorted", indices: [i + 1], description: `Pivot index ${i + 1} now sorted` });
    qs(lo, i);
    qs(i + 2, hi);
  }
  qs(0, a.length - 1);
  return steps;
}

// ---------- Merge Sort ----------
export function mergeSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];

  function ms(lo: number, hi: number) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ type: "rangeHighlight", indices: [], range: [lo, hi], description: `Divide range [${lo}..${hi}]` });
    ms(lo, mid);
    ms(mid + 1, hi);
    merge(lo, mid, hi);
  }

  function merge(lo: number, mid: number, hi: number) {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    steps.push({ type: "rangeHighlight", indices: [], range: [lo, hi], description: `Merge [${lo}..${mid}] and [${mid + 1}..${hi}]` });
    while (i < left.length && j < right.length) {
      steps.push({ type: "compare", indices: [lo + i, mid + 1 + j], description: `Compare ${left[i]} and ${right[j]}` });
      if (left[i] <= right[j]) {
        a[k] = left[i++];
      } else {
        a[k] = right[j++];
      }
      steps.push({ type: "overwrite", indices: [k], values: [a[k]], description: `Write ${a[k]} at index ${k}` });
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      steps.push({ type: "overwrite", indices: [k], values: [a[k]], description: `Write ${a[k]} at index ${k}` });
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      steps.push({ type: "overwrite", indices: [k], values: [a[k]], description: `Write ${a[k]} at index ${k}` });
      k++;
    }
    if (lo === 0 && hi === a.length - 1) {
      for (let x = lo; x <= hi; x++) steps.push({ type: "markSorted", indices: [x], description: `Index ${x} sorted` });
    }
  }

  ms(0, a.length - 1);
  return steps;
}

// ---------- Dataset generators ----------
export type Pattern = "random" | "sorted" | "reversed" | "nearly" | "custom";

export function parseArrayInput(input: string): { array?: number[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Enter a comma-separated array of numbers." };
  }

  try {
    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { error: "Custom input must be a numeric array, e.g. [5, 3, 8]." };
      }
      const arr = parsed.map((item, idx) => {
        if (typeof item !== "number" || Number.isNaN(item)) {
          throw new Error(`Invalid number at index ${idx}: ${String(item)}`);
        }
        return item;
      });
      return { array: arr };
    }

    const values = trimmed.split(/[\s,]+/).filter((v) => v.length > 0);
    if (values.length === 0) {
      return { error: "Enter a comma-separated array of numbers." };
    }
    const arr = values.map((value, index) => {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number at index ${index}: ${value}`);
      }
      return num;
    });
    return { array: arr };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Invalid custom array input.",
    };
  }
}

export function generateArray(size: number, pattern: Pattern = "random"): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 1).map((v) => v * Math.floor(100 / size));
  switch (pattern) {
    case "sorted":
      return arr;
    case "reversed":
      return arr.reverse();
    case "nearly": {
      // shuffle a few pairs
      const a = [...arr];
      const swaps = Math.max(2, Math.floor(size * 0.1));
      for (let i = 0; i < swaps; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        [a[x], a[y]] = [a[y], a[x]];
      }
      return a;
    }
    case "custom":
      return arr;
    case "random":
    default: {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  }
}

export const ALGO_INFO = {
  bubble: { name: "Bubble Sort", complexity: "O(n²)", description: "Repeatedly swap adjacent out-of-order pairs." },
  quick:  { name: "Quick Sort",  complexity: "O(n log n)", description: "Partition around a pivot, recurse on halves." },
  merge:  { name: "Merge Sort",  complexity: "O(n log n)", description: "Divide the array, sort halves, merge them." },
} as const;

export type AlgoKey = keyof typeof ALGO_INFO;

export function getStepsFor(algo: AlgoKey, arr: number[]): Step[] {
  switch (algo) {
    case "bubble": return bubbleSortSteps(arr);
    case "quick":  return quickSortSteps(arr);
    case "merge":  return mergeSortSteps(arr);
  }
}
