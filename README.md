# Sortlab — Algorithm Visualizer

An interactive, step-by-step visualizer for classic sorting algorithms and binary tree traversals. Watch every comparison, swap, and merge animate in real time, control the playback speed, and build genuine intuition for how these algorithms work.

---

## ✨ Features

### Sorting Visualizer (`/`)
- **Three algorithms** — Bubble Sort, Quick Sort, and Merge Sort
- **Step engine** — every frame is a real algorithm step (compare, swap, overwrite, pivot, markSorted, rangeHighlight)
- **Play / Pause / Step forward / Step backward** — full playback control
- **Speed slider** — from slow-motion to near-instant
- **Dataset patterns** — Random, Sorted, Reversed, Nearly Sorted, or a fully custom array
- **Custom array input** — accepts comma-separated values or a JSON array
- **Color-coded bars** — Idle, Compare, Swap, Pivot, Merge/Range, and Sorted states each have a distinct color
- **Step descriptions** — plain-English narration of what the algorithm is doing at each frame
- **Progress bar** — shows how far through the step sequence you are
- **Algorithm info cards** — name, time complexity, and description shown below the visualizer

### Tree Traversal Visualizer (`/tree`)
- **Three DFS traversals** — In-order, Pre-order, Post-order
- **Animated binary tree** — nodes highlight as they are visited
- **Live source code panel** — the exact line being executed is highlighted in sync with the animation

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI primitives |
| Icons | Lucide React |
| Build | Vite 7 |
| Code quality | ESLint + Prettier |

---

## ✨ Preview
# Sorting

<img width="1903" height="942" alt="image" src="https://github.com/user-attachments/assets/860075be-5cc2-4840-bb84-4afba9c18566" />
<img width="1903" height="945" alt="image" src="https://github.com/user-attachments/assets/804d6129-7958-4966-9247-1a1254be9252" />

# Tree

<img width="1902" height="943" alt="image" src="https://github.com/user-attachments/assets/4be929b0-c286-4e34-9c36-2be8e73a1b99" />
<img width="1907" height="943" alt="image" src="https://github.com/user-attachments/assets/b0870eaa-440f-4804-9c92-da258f0eb1ad" />




## 📂 Project Structure

```
src/
├── lib/
│   ├── algorithms.ts       # Step generators for Bubble, Quick, Merge sort + dataset helpers
│   └── tree.ts             # Binary tree data structure + DFS traversal step generators
├── components/
│   ├── Visualizer.tsx      # Sorting visualizer (bars, controls, playback engine)
│   ├── TreeVisualizer.tsx  # Tree traversal visualizer with live code panel
│   └── ui/                 # shadcn/ui component library
├── routes/
│   ├── __root.tsx          # Root layout
│   ├── index.tsx           # Sorting page (/)
│   └── tree.tsx            # Tree traversal page (/tree)
├── hooks/
│   └── use-mobile.tsx      # Responsive breakpoint hook
├── router.tsx              # TanStack Router setup + error boundary
├── routeTree.gen.ts        # Auto-generated route tree
└── styles.css              # Global styles + CSS custom properties (bar colors, themes)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+, or [Bun](https://bun.sh/)

### Install & run

```bash
# Clone the repo
git clone https://github.com/your-username/algorithm-visualizer.git
cd algorithm-visualizer

# Install dependencies
npm install
# or
bun install

# Start the dev server
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run format       # Prettier
```

---

## ⚙️ How the Step Engine Works

All algorithms are pre-computed into a flat array of `Step` objects before playback begins. Each step has a `type`, the `indices` it affects, optional new `values`, and a human-readable `description`.

```ts
type StepType = "compare" | "swap" | "overwrite" | "pivot" | "markSorted" | "rangeHighlight";
```

The visualizer replays steps by rebuilding bar state from scratch up to the current index (`rebuild(initial, steps, stepIndex)`). This makes scrubbing backward free — there's no undo stack needed.

Playback speed is controlled by a `setTimeout` delay computed as `max(8, 320 - speed * 3)` ms, giving a range of roughly 8ms (fastest) to 320ms (slowest) between frames.

---


## Don't forget to :star: the repository.

## Support ❤️
For support, you can contact me at this [Email](ammadsajjad40@gmail.com) or at [Instagram](https://www.instagram.com/ammad__sajjad_/).
