import { useEffect, useMemo, useRef, useState } from "react";
import {
  TRAVERSAL_CODE,
  TraversalKind,
  TreeNode,
  TreeStep,
  buildSampleTree,
  traversalSteps,
  parseCppTraversal,
  customTraversalSteps,
  DEFAULT_CPP_CODE,
  parseTreeInput,
} from "@/lib/tree";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Code2 } from "lucide-react";

type Mode = TraversalKind | "custom";

const traversalOptions: { key: Mode; label: string }[] = [
  { key: "inorder", label: "In-order" },
  { key: "preorder", label: "Pre-order" },
  { key: "postorder", label: "Post-order" },
  { key: "custom", label: "Custom C++" },
];

export default function TreeVisualizer() {
  const [kind, setKind] = useState<Mode>("inorder");
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(55);
  const [cppCode, setCppCode] = useState<string>(DEFAULT_CPP_CODE);
  const [treeInput, setTreeInput] = useState<string>(
    "[5, 3, 8, 1, 4, 6, 10, 0, 2, null, null, null, 7, 9]"
  );
  const timerRef = useRef<number | null>(null);

  const { nodes, treeInputError } = useMemo(() => {
    const result = parseTreeInput(treeInput);
    return {
      nodes: result.nodes ?? buildSampleTree(),
      treeInputError: result.error,
    };
  }, [treeInput]);

  const { steps, codeLines, parseError, headerLabel } = useMemo(() => {
    if (kind === "custom") {
      const { program, error } = parseCppTraversal(cppCode);
      if (!program) {
        return { steps: [] as TreeStep[], codeLines: cppCode.split("\n"), parseError: error, headerLabel: "custom.cpp" };
      }
      return {
        steps: customTraversalSteps(nodes, 0, program),
        codeLines: program.sourceLines,
        parseError: undefined as string | undefined,
        headerLabel: "custom.cpp",
      };
    }
    return {
      steps: traversalSteps(nodes, 0, kind),
      codeLines: TRAVERSAL_CODE[kind],
      parseError: undefined as string | undefined,
      headerLabel: `${kind}.js`,
    };
  }, [nodes, kind, cppCode]);

  // Derived state up to current step
  const { activeNode, visitedSet, traversedEdges, output, currentLine } = useMemo(() => {
    const visitedSet = new Set<number>();
    const traversedEdges = new Set<string>();
    const output: number[] = [];
    let activeNode: number | null = null;
    let currentLine = 0;
    for (let i = 0; i <= stepIndex && i < steps.length; i++) {
      const s = steps[i];
      currentLine = s.line;
      if (s.nodeId !== null) activeNode = s.nodeId;
      if (s.type === "visit" && s.nodeId !== null) {
        visitedSet.add(s.nodeId);
        if (s.output !== undefined) output.push(s.output);
      }
      if (s.edge) traversedEdges.add(`${s.edge[0]}-${s.edge[1]}`);
    }
    return { activeNode, visitedSet, traversedEdges, output, currentLine };
  }, [steps, stepIndex]);

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null;

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(80, 700 - speed * 6);
    timerRef.current = window.setTimeout(() => setStepIndex((s) => s + 1), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, stepIndex, steps.length, speed]);

  function reset() {
    setPlaying(false);
    setStepIndex(-1);
  }

  // SVG layout
  const W = 640;
  const H = 360;
  const PAD_X = 40;
  const PAD_Y = 30;
  const px = (x: number) => PAD_X + x * (W - PAD_X * 2);
  const py = (y: number) => PAD_Y + y * (H - PAD_Y * 2);

  const [editingCode, setEditingCode] = useState(false);

  return (
    <div className="w-full">
      {/* Traversal selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {traversalOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setKind(opt.key); setStepIndex(-1); setPlaying(false); }}
            className={`px-4 py-2 rounded-md font-mono text-sm border transition-all ${
              kind === opt.key
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_24px_-6px_var(--primary)]"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-4 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Custom tree</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a tree as a level-order array, nested object, or simple list.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Example: <span className="text-foreground">[5,3,8,1,4,null,10]</span>
          </div>
        </div>
        <textarea
          value={treeInput}
          onChange={(e) => {
            setTreeInput(e.target.value);
            setStepIndex(-1);
            setPlaying(false);
          }}
          spellCheck={false}
          className="w-full min-h-[120px] mt-3 bg-transparent text-foreground font-mono text-xs leading-relaxed p-3 outline-none resize-y border border-border rounded-md"
          placeholder="[5, 3, 8, 1, 4, null, 10]"
        />
        {treeInputError && (
          <div className="mt-2 px-3 py-2 border-t border-border bg-destructive/10 text-destructive font-mono text-[11px]">
            ⚠ {treeInputError}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Tree canvas */}
        <div className="rounded-xl border border-border bg-card/40 backdrop-blur p-4 overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* edges */}
            {nodes.map((n) =>
              [n.left, n.right].map((cid, idx) => {
                if (cid === null) return null;
                const c = nodes[cid];
                const key = `${n.id}-${cid}`;
                const active = traversedEdges.has(key);
                const isCurrent = currentStep?.edge?.[0] === n.id && currentStep?.edge?.[1] === cid;
                return (
                  <line
                    key={`${n.id}-${idx}`}
                    x1={px(n.x)} y1={py(n.y)}
                    x2={px(c.x)} y2={py(c.y)}
                    stroke={isCurrent ? "var(--bar-pivot)" : active ? "var(--bar-sorted)" : "var(--border)"}
                    strokeWidth={isCurrent ? 3 : active ? 2.2 : 1.5}
                    style={{ transition: "all 200ms" }}
                  />
                );
              })
            )}
            {/* nodes */}
            {nodes.map((n) => {
              const visited = visitedSet.has(n.id);
              const isActive = activeNode === n.id;
              const fill = visited
                ? "var(--bar-sorted)"
                : isActive
                  ? "var(--bar-pivot)"
                  : "var(--bar-default)";
              return (
                <g key={n.id} style={{ transition: "all 200ms" }}>
                  <circle
                    cx={px(n.x)} cy={py(n.y)} r={18}
                    fill={fill}
                    stroke={isActive ? "var(--bar-pivot)" : "var(--border)"}
                    strokeWidth={isActive ? 3 : 1.5}
                    style={{
                      filter: isActive ? "drop-shadow(0 0 8px var(--bar-pivot))" : visited ? "drop-shadow(0 0 4px var(--bar-sorted))" : undefined,
                      transition: "all 200ms",
                    }}
                  />
                  <text
                    x={px(n.x)} y={py(n.y) + 4}
                    textAnchor="middle"
                    fontSize={13}
                    fontFamily="monospace"
                    fill={visited || isActive ? "var(--background)" : "var(--foreground)"}
                  >
                    {n.value}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Output strip */}
          <div className="mt-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">OUTPUT</div>
            <div className="flex flex-wrap gap-1">
              {nodes.map((_, i) => {
                const v = output[i];
                return (
                  <div
                    key={i}
                    className="h-7 min-w-7 px-2 rounded-sm border font-mono text-xs flex items-center justify-center"
                    style={{
                      borderColor: v !== undefined ? "var(--bar-sorted)" : "var(--border)",
                      backgroundColor: v !== undefined ? "color-mix(in oklab, var(--bar-sorted) 25%, transparent)" : "transparent",
                      color: v !== undefined ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                  >
                    {v !== undefined ? v : "·"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step description */}
          <div className="mt-3 min-h-[2rem] font-mono text-sm text-muted-foreground">
            {currentStep ? (
              <span key={stepIndex} className="animate-fade-up inline-block">
                <span className="text-primary mr-2">▸</span>{currentStep.description}
              </span>
            ) : (
              <span className="opacity-60">Press play to start the traversal.</span>
            )}
          </div>
        </div>

        {/* Code panel */}
        <div className="rounded-xl border border-border bg-card/40 backdrop-blur overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border font-mono text-xs text-muted-foreground flex items-center justify-between">
            <span>{headerLabel}</span>
            <div className="flex items-center gap-2">
              {kind === "custom" && (
                <button
                  onClick={() => { setEditingCode((e) => !e); setStepIndex(-1); setPlaying(false); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:border-primary/50 text-foreground"
                >
                  <Code2 className="h-3 w-3" />
                  {editingCode ? "Done" : "Edit"}
                </button>
              )}
              <span>line {currentLine + 1}</span>
            </div>
          </div>

          {kind === "custom" && editingCode ? (
            <textarea
              value={cppCode}
              onChange={(e) => setCppCode(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[260px] bg-transparent text-foreground font-mono text-xs leading-relaxed p-3 outline-none resize-y"
            />
          ) : (
            <pre className="text-xs font-mono leading-relaxed p-0 m-0">
              {codeLines.map((line, i) => {
                const active = stepIndex >= 0 && i === currentLine;
                return (
                  <div
                    key={i}
                    className="flex"
                    style={{
                      backgroundColor: active ? "color-mix(in oklab, var(--primary) 22%, transparent)" : "transparent",
                      borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent",
                      transition: "background-color 150ms",
                    }}
                  >
                    <span className="w-8 text-right pr-2 text-muted-foreground select-none">{i + 1}</span>
                    <span className={active ? "text-foreground" : "text-muted-foreground"}>{line || " "}</span>
                  </div>
                );
              })}
            </pre>
          )}

          {parseError && (
            <div className="px-3 py-2 border-t border-border bg-destructive/10 text-destructive font-mono text-[11px]">
              ⚠ {parseError}
            </div>
          )}
          {kind === "custom" && !parseError && !editingCode && (
            <div className="px-3 py-2 border-t border-border text-muted-foreground font-mono text-[10px]">
              Tip: edit code, then press Play. Supported: <span className="text-foreground">traverse(node-&gt;left/right)</span>, <span className="text-foreground">cout &lt;&lt; node-&gt;val</span>.
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline" size="icon"
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
            variant="outline" size="icon"
            onClick={() => { setPlaying(false); setStepIndex((s) => Math.min(steps.length - 1, s + 1)); }}
            disabled={stepIndex >= steps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={reset} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            STEP {stepIndex + 1}/{steps.length}
          </span>
        </div>

        <div className="flex items-center gap-3 min-w-[240px]">
          <span className="font-mono text-xs text-muted-foreground">SPEED</span>
          <Slider value={[speed]} min={0} max={100} step={1} onValueChange={(v) => setSpeed(v[0])} className="flex-1" />
          <span className="font-mono text-xs w-8 text-right">{speed}</span>
        </div>
      </div>
    </div>
  );
}
