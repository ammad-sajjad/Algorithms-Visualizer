import { createFileRoute, Link } from "@tanstack/react-router";
import TreeVisualizer from "@/components/TreeVisualizer";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "Tree Traversals — Sortlab" },
      { name: "description", content: "Animated in-order, pre-order and post-order DFS traversals on a binary tree, with synced source code." },
      { property: "og:title", content: "Tree Traversals — Sortlab" },
      { property: "og:description", content: "Visualize DFS traversals on a binary tree, step by step, with the source code highlighted live." },
    ],
  }),
  component: TreePage,
});

function TreePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, color-mix(in oklab, var(--bar-pivot) 18%, transparent) 0%, transparent 60%), radial-gradient(50% 40% at 10% 10%, color-mix(in oklab, var(--primary) 15%, transparent) 0%, transparent 60%)",
        }}
      />

      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="tracking-widest">SORTLAB</span>
        </Link>
        <nav className="flex gap-4 font-mono text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">SORT</Link>
          <Link to="/tree" className="text-foreground" activeProps={{ className: "text-foreground" }}>TREE</Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-6 pb-10">
        <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Walk the
          <br />
          <span className="text-primary">tree</span>, step by step.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Watch DFS traversals — in-order, pre-order and post-order — animate
          across a binary tree while the source code highlights the exact line
          being executed.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <TreeVisualizer />
      </section>
    </main>
  );
}
