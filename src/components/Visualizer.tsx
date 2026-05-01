import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALGO_INFO,
  AlgoKey,
  Pattern,
  Step,
  generateArray,
  getStepsFor,
  parseArrayInput,
} from "@/lib/algorithms";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Shuffle, RotateCcw } from "lucide-react";

const SIZE = 32;

interface BarState {
  value: number;
  state: "default" | "compare" | "swap" | "pivot" | "sorted" | "overlay";
}

function buildInitialBars(arr: number[]): BarState[] {
  return arr.map((v) => ({ value: v, state: "default" }));
}

// Apply step to current bars (returns new bars + ephemeral highlight indices)
function applyStep(bars: BarState[], step: Step): BarState[] {
  const next = bars.map((b) => ({ ...b, state: b.state === "sorted" ? "sorted" : "default" as BarState["state"] }));

  switch (step.type) {
    case "compare":
      step.indices.forEach((i) => { if (next[i].state !== "sorted") next[i].state = "compare"; });
      break;
    case "swap": {
      const [i, j] = step.indices;
      if (step.values && step.values.length === 2) {
        next[i].value = step.values[0];
        next[j].value = step.values[1];
      }
      if (next[i].state !== "sorted") next[i].state = "swap";
      if (next[j].state !== "sorted") next[j].state = "swap";
      break;
    }
    case "overwrite": {
      step.indices.forEach((idx, k) => {
        if (step.values) next[idx].value = step.values[k];
        if (next[idx].state !== "sorted") next[idx].state = "overlay";
      });
      break;
    }
    case "pivot":
      step.indices.forEach((i) => { next[i].state = "pivot"; });
      break;
    case "markSorted":
      step.indices.forEach((i) => { next[i].state = "sorted"; });
      break;
    case "rangeHighlight":
      if (step.range) {
        const [lo, hi] = step.range;
        for (let i = lo; i <= hi; i++) {
          if (next[i].state !== "sorted") next[i].state = "overlay";
        }
      }
      break;
  }
  return next;
}

// Rebuild bars by replaying steps 0..stepIndex from the original array
function rebuild(initial: number[], steps: Step[], upto: number): BarState[] {
  let bars = buildInitialBars(initial);
  for (let i = 0; i <= upto && i < steps.length; i++) {
    bars = applyStep(bars, steps[i]);
  }
  return bars;
}

const algoOptions: { key: AlgoKey; label: string }[] = [
  { key: "bubble", label: "Bubble" },
  { key: "quick", label: "Quick" },
  { key: "merge", label: "Merge" },
];

const patternOptions: { key: Pattern; label: string }[] = [
  { key: "random", label: "Random" },
  { key: "sorted", label: "Sorted" },
  { key: "reversed", label: "Reversed" },
  { key: "nearly", label: "Nearly" },
  { key: "custom", label: "Custom" },
];

export default function Visualizer() {
  const [algo, setAlgo] = useState<AlgoKey>("bubble");
  const [pattern, setPattern] = useState<Pattern>("random");
  const [customArray, setCustomArray] = useState<string>("5, 3, 8, 1, 4, 6, 10, 2");
  // Use deterministic "sorted" pattern for SSR/initial render to avoid hydration mismatch.
  const [initialArray, setInitialArray] = useState<number[]>(() => generateArray(SIZE, "sorted"));
  useEffect(() => {
    // After mount, shuffle to a random array on the client only.
    setInitialArray(generateArray(SIZE, "random"));
    setPattern("random");
  }, []);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60); // 0..100, higher = faster
  const timerRef = useRef<number | null>(null);

  const parsedCustom = useMemo(() => parseArrayInput(customArray), [customArray]);
  const steps = useMemo(() => getStepsFor(algo, initialArray), [algo, initialArray]);
  const bars = useMemo(() => rebuild(initialArray, steps, stepIndex), [initialArray, steps, stepIndex]);

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null;
  const stats = useMemo(() => {
    let comparisons = 0, swaps = 0;
    for (let i = 0; i <= stepIndex && i < steps.length; i++) {
      if (steps[i].type === "compare") comparisons++;
      if (steps[i].type === "swap") swaps++;
    }
    return { comparisons, swaps };
  }, [steps, stepIndex]);

  // Playback
  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(8, 320 - speed * 3);
    timerRef.current = window.setTimeout(() => setStepIndex((s) => s + 1), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, stepIndex, steps.length, speed]);

  function reset(newArr?: number[], newPattern?: Pattern) {
    setPlaying(false);
    setStepIndex(-1);
    if (newArr) setInitialArray(newArr);
    if (newPattern) setPattern(newPattern);
  }

  function regenerate(p: Pattern = pattern) {
    if (p === "custom") {
      if (parsedCustom.array) {
        reset(parsedCustom.array, "custom");
      }
      return;
    }
    reset(generateArray(SIZE, p), p);
  }

  function stateColor(s: BarState["state"]) {
    switch (s) {
      case "compare": return "var(--bar-compare)";
      case "swap":    return "var(--bar-swap)";
      case "pivot":   return "var(--bar-pivot)";
      case "sorted":  return "var(--bar-sorted)";
      case "overlay": return "var(--bar-overlay)";
      default:        return "var(--bar-default)";
    }
  }

  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  const progress = steps.length === 0 ? 0 : ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Algo selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {algoOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setAlgo(opt.key); setStepIndex(-1); setPlaying(false); }}
            className={`px-4 py-2 rounded-md font-mono text-sm border transition-all ${
              algo === opt.key
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_24px_-6px_var(--primary)]"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="px-2 py-1 rounded bg-card border border-border">
            {ALGO_INFO[algo].complexity}
          </span>
        </div>
      </div>

      {/* Visualization area */}
      <div className="relative rounded-xl border border-border bg-card/40 backdrop-blur p-6 overflow-hidden">
        {/* progress line */}
        <div className="absolute top-0 left-0 h-[2px] bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />

        <div className="h-[360px] flex items-end justify-center gap-[3px]">
          {bars.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-100"
              style={{
                height: `${(b.value / maxValue) * 100}%`,
                backgroundColor: stateColor(b.state),
                boxShadow: b.state === "swap" ? "0 0 12px var(--bar-swap)" : b.state === "pivot" ? "0 0 12px var(--bar-pivot)" : undefined,
              }}
            />
          ))}
        </div>

        {/* Step description */}
        <div className="mt-4 min-h-[2.5rem] font-mono text-sm text-muted-foreground">
          {currentStep ? (
            <span key={stepIndex} className="animate-fade-up inline-block">
              <span className="text-primary mr-2">▸</span>{currentStep.description}
            </span>
          ) : (
            <span className="opacity-60">Press play to start the visualization.</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setPlaying(false); setStepIndex((s) => Math.max(-1, s - 1)); }}
            disabled={stepIndex < 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            onClick={() => {
              if (stepIndex >= steps.length - 1) setStepIndex(-1);
              setPlaying((p) => !p);
            }}
            className="px-6"
          >
            {playing ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Play</>}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setPlaying(false); setStepIndex((s) => Math.min(steps.length - 1, s + 1)); }}
            disabled={stepIndex >= steps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => reset()} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => regenerate()} title="Shuffle">
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 min-w-[240px]">
          <span className="font-mono text-xs text-muted-foreground">SPEED</span>
          <Slider
            value={[speed]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setSpeed(v[0])}
            className="flex-1"
          />
          <span className="font-mono text-xs w-8 text-right">{speed}</span>
        </div>
      </div>

      {/* Pattern + Stats */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="font-mono text-xs text-muted-foreground mb-2">DATASET</div>
          <div className="flex flex-wrap gap-2">
            {patternOptions.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  if (p.key === "custom") {
                    if (parsedCustom.array) {
                      reset(parsedCustom.array, "custom");
                    }
                    setPattern("custom");
                  } else {
                    regenerate(p.key);
                    setPattern(p.key);
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                  pattern === p.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent border-border hover:border-foreground/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {pattern === "custom" && (
            <div className="mt-4">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">CUSTOM ARRAY</div>
              <textarea
                value={customArray}
                onChange={(e) => {
                  setCustomArray(e.target.value);
                  if (pattern === "custom") {
                    const result = parseArrayInput(e.target.value);
                    if (result.array) {
                      reset(result.array, "custom");
                    }
                  }
                }}
                spellCheck={false}
                className="w-full min-h-[100px] mt-2 bg-transparent text-foreground font-mono text-xs leading-relaxed p-3 outline-none resize-y border border-border rounded-md"
                placeholder="5, 3, 8, 1, 4, 6, 10"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Supported: comma-separated list or JSON array.
              </div>
              {parsedCustom.error && (
                <div className="mt-2 px-3 py-2 border-t border-border bg-destructive/10 text-destructive font-mono text-[11px]">
                  ⚠ {parsedCustom.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
        <Legend color="var(--bar-default)" label="Idle" />
        <Legend color="var(--bar-compare)" label="Compare" />
        <Legend color="var(--bar-swap)" label="Swap" />
        <Legend color="var(--bar-pivot)" label="Pivot" />
        <Legend color="var(--bar-overlay)" label="Merge / Range" />
        <Legend color="var(--bar-sorted)" label="Sorted" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-lg" style={{ color: accent ?? "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
