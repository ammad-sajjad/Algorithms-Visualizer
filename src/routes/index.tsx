import { createFileRoute, Link } from "@tanstack/react-router";
import Visualizer from "@/components/Visualizer";
import { ALGO_INFO } from "@/lib/algorithms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sortlab — Interactive Sorting Algorithm Visualizer" },
      { name: "description", content: "Watch Bubble, Quick & Merge sort step by step. Play, pause, scrub and learn how sorting algorithms really work." },
      { property: "og:title", content: "Sortlab — Sorting Algorithm Visualizer" },
      { property: "og:description", content: "Step-by-step animated visualizations of classic sorting algorithms." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 60%), radial-gradient(50% 40% at 90% 10%, color-mix(in oklab, var(--bar-pivot) 15%, transparent) 0%, transparent 60%)",
        }}
      />

      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="tracking-widest">SORTLAB</span>
        </div>
        <nav className="flex gap-4 font-mono text-xs text-muted-foreground">
          <Link to="/" className="text-foreground">SORT</Link>
          <Link to="/tree" className="hover:text-foreground transition-colors">TREE →</Link>
          <a href="#about" className="hover:text-foreground transition-colors">ABOUT ↓</a>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-6 pb-10">
        <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          See how
          <br />
          <span className="text-primary">algorithms</span> think.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          A minimal, interactive playground for sorting algorithms. Step through
          comparisons and swaps, control the pace, and build real intuition for
          DSA — one frame at a time.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Visualizer />
      </section>

      <section id="about" className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-mono text-2xl mb-6">The algorithms</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(ALGO_INFO) as (keyof typeof ALGO_INFO)[]).map((k) => (
            <article
              key={k}
              className="rounded-xl border border-border bg-card/40 p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-mono text-lg">{ALGO_INFO[k].name}</h3>
                <span className="font-mono text-xs text-primary">{ALGO_INFO[k].complexity}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{ALGO_INFO[k].description}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 font-mono text-xs text-muted-foreground">
          Built for learners. Every frame is a real algorithm step.
        </p>
      </section>
    </main>
  );
}
