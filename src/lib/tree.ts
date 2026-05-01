// Binary tree + DFS traversal step engine

export interface TreeNode {
  id: number;
  value: number;
  left: number | null;  // node id
  right: number | null;
  x: number; // layout x (0..1)
  y: number; // layout y (0..1)
  depth: number;
}

export type TraversalKind = "inorder" | "preorder" | "postorder";

export type TreeStepType =
  | "enter"        // entering node (push frame)
  | "goLeft"
  | "goRight"
  | "visit"        // visit/print node
  | "backtrack"    // returning from node
  | "nullChild";   // hit a null child

export interface TreeStep {
  type: TreeStepType;
  nodeId: number | null;
  parentId?: number | null;
  edge?: [number, number]; // active edge [parent, child]
  output?: number;         // value pushed to output sequence at this step
  description: string;
  line: number;            // highlighted source line
}

// ---------- Dynamic Tree Builder ----------
// Parses user input to build a custom tree structure
// Supported formats:
// 1. Array format: [5, 3, 8, 1, 4, 6, 10, 0, 2, null, null, null, 7, 9]
// 2. Object format: { value: 5, left: { value: 3, ... }, right: { value: 8, ... } }
// 3. Simple list: 5, 3, 8, 1, 4, 6, 10 (builds a complete binary tree level by level)

export interface TreeInputResult {
  nodes?: TreeNode[];
  error?: string;
}

export function parseTreeInput(input: string): TreeInputResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { error: "Please enter a tree structure." };
  }

  try {
    // Try to parse as JSON array first: [5, 3, 8, 1, 4, null, 10]
    if (trimmed.startsWith('[')) {
      const arr = JSON.parse(trimmed);
      if (!Array.isArray(arr)) {
        return { error: "Invalid array format." };
      }
      return buildTreeFromArray(arr);
    }
    
    // Try to parse as JSON object: { value: 5, left: {...}, right: {...} }
    if (trimmed.startsWith('{')) {
      const obj = JSON.parse(trimmed);
      return buildTreeFromObject(obj);
    }
    
    // Try comma-separated values: 5, 3, 8, 1, 4, 6, 10
    const values = trimmed.split(/[,\s]+/).filter(v => v.length > 0);
    const arr = values.map(v => {
      const lower = v.toLowerCase();
      if (lower === 'null' || lower === 'none' || lower === '-') return null;
      const num = parseInt(v, 10);
      if (isNaN(num)) throw new Error(`Invalid value: ${v}`);
      return num;
    });
    
    return buildTreeFromArray(arr);
  } catch (e) {
    return { error: `Parse error: ${e instanceof Error ? e.message : 'Invalid input'}` };
  }
}

// Build tree from level-order array (like LeetCode format)
// [5, 3, 8, 1, 4, null, 10] builds:
//       5
//      / \
//     3   8
//    / \   \
//   1   4  10
function buildTreeFromArray(arr: (number | null)[]): TreeInputResult {
  if (arr.length === 0 || arr[0] === null) {
    return { error: "Tree must have at least one node (root)." };
  }

  const nodes: TreeNode[] = [];
  const queue: number[] = [];
  
  // Create root
  nodes.push({
    id: 0,
    value: arr[0] as number,
    left: null,
    right: null,
    x: 0,
    y: 0,
    depth: 0,
  });
  queue.push(0);
  
  let i = 1;
  while (i < arr.length && queue.length > 0) {
    const parentId = queue.shift()!;
    
    // Left child
    if (i < arr.length) {
      if (arr[i] !== null) {
        const leftId = nodes.length;
        nodes.push({
          id: leftId,
          value: arr[i] as number,
          left: null,
          right: null,
          x: 0,
          y: 0,
          depth: 0,
        });
        nodes[parentId].left = leftId;
        queue.push(leftId);
      }
      i++;
    }
    
    // Right child
    if (i < arr.length) {
      if (arr[i] !== null) {
        const rightId = nodes.length;
        nodes.push({
          id: rightId,
          value: arr[i] as number,
          left: null,
          right: null,
          x: 0,
          y: 0,
          depth: 0,
        });
        nodes[parentId].right = rightId;
        queue.push(rightId);
      }
      i++;
    }
  }
  
  layoutTree(nodes, 0);
  return { nodes };
}

// Build tree from nested object structure
interface TreeObjectNode {
  value: number;
  val?: number;
  left?: TreeObjectNode | null;
  right?: TreeObjectNode | null;
}

function buildTreeFromObject(obj: TreeObjectNode): TreeInputResult {
  const nodes: TreeNode[] = [];
  
  function createNode(o: TreeObjectNode | null | undefined): number | null {
    if (!o) return null;
    
    const value = o.value ?? o.val;
    if (typeof value !== 'number') {
      throw new Error("Each node must have a 'value' or 'val' property.");
    }
    
    const id = nodes.length;
    nodes.push({
      id,
      value,
      left: null,
      right: null,
      x: 0,
      y: 0,
      depth: 0,
    });
    
    nodes[id].left = createNode(o.left);
    nodes[id].right = createNode(o.right);
    
    return id;
  }
  
  try {
    createNode(obj);
    if (nodes.length === 0) {
      return { error: "Tree must have at least one node." };
    }
    layoutTree(nodes, 0);
    return { nodes };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid tree object' };
  }
}

// Build a default sample tree (for initial state)
// Tree:
//          5
//        /   \
//       3     8
//      / \   / \
//     1   4 6   10
//    / \     \   /
//   0   2     7 9
export function buildSampleTree(): TreeNode[] {
  // id, value, left, right
  const raw: Array<[number, number, number | null, number | null]> = [
    [0, 5, 1, 2],
    [1, 3, 3, 4],
    [2, 8, 5, 6],
    [3, 1, 7, 8],
    [4, 4, null, null],
    [5, 6, null, 9],
    [6, 10, 10, null],
    [7, 0, null, null],
    [8, 2, null, null],
    [9, 7, null, null],
    [10, 9, null, null],
  ];
  const nodes: TreeNode[] = raw.map(([id, value, left, right]) => ({
    id, value, left, right, x: 0, y: 0, depth: 0,
  }));
  layoutTree(nodes, 0);
  return nodes;
}

// Simple in-order layout: assigns x by in-order index, y by depth.
function layoutTree(nodes: TreeNode[], rootId: number) {
  let counter = 0;
  let maxDepth = 0;
  function assign(id: number | null, depth: number) {
    if (id === null) return;
    const n = nodes[id];
    n.depth = depth;
    if (depth > maxDepth) maxDepth = depth;
    assign(n.left, depth + 1);
    n.x = counter++;
    assign(n.right, depth + 1);
  }
  assign(rootId, 0);
  const total = counter - 1 || 1;
  for (const n of nodes) {
    n.x = n.x / total;
    n.y = maxDepth === 0 ? 0 : n.depth / maxDepth;
  }
}

// ---------- Traversal step generators ----------
// Line numbers correspond to TRAVERSAL_CODE below.

export const TRAVERSAL_CODE: Record<TraversalKind, string[]> = {
  inorder: [
    "def inorder(node):",
    "    if node is None: return",
    "    inorder(node.left)",
    "    visit(node)",
    "    inorder(node.right)",
  ],
  preorder: [
    "def preorder(node):",
    "    if node is None: return",
    "    visit(node)",
    "    preorder(node.left)",
    "    preorder(node.right)",
  ],
  postorder: [
    "def postorder(node):",
    "    if node is None: return",
    "    postorder(node.left)",
    "    postorder(node.right)",
    "    visit(node)",
  ],
};

// ---------- Custom Python traversal parser ----------
// We parse a single recursive function body and extract the ORDER of:
//   - traverse(node.left)  / recurse left
//   - traverse(node.right) / recurse right
//   - print(node.val)      / visit(node)
// Everything else (imports, class definitions, helper functions) is ignored.
// Returns an "action plan" that can be replayed against the tree to produce TreeSteps.

export type CustomAction =
  | { kind: "left"; line: number }
  | { kind: "right"; line: number }
  | { kind: "visit"; line: number };

export interface CustomProgram {
  actions: CustomAction[];
  funcName: string;
  baseCaseLine: number; // line of the `if node is None: return` style guard
  openLine: number;     // line of `def traverse(...)`
  closeLine: number;    // last line of function
  sourceLines: string[];
}

export const DEFAULT_PYTHON_CODE = `def traverse(node):
    if node is None:
        return
    traverse(node.left)
    print(node.val)
    traverse(node.right)`;

export function parsePythonTraversal(source: string): { program?: CustomProgram; error?: string } {
  const lines = source.split("\n");
  
  // Find all function definitions that take a single node-like parameter
  const funcPattern = /^\s*def\s+(\w+)\s*\(\s*(\w+)\s*(?:,\s*\w+\s*=\s*[^)]+)?\s*\)\s*:/;
  
  // Find the traversal function - look for one that has recursive calls and node.left/right access
  let funcLine = -1;
  let funcName = "";
  let funcIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (match) {
      // Check if this function looks like a traversal (has node.left or node.right in its body)
      let hasNodeAccess = false;
      const indent = lines[i].search(/\S/);
      
      // Look ahead in the function body
      for (let j = i + 1; j < lines.length; j++) {
        const lineIndent = lines[j].search(/\S/);
        const trimmed = lines[j].trim();
        
        // Skip empty lines
        if (!trimmed) continue;
        
        // If we hit a line with same or less indentation, function ended
        if (lineIndent <= indent && trimmed.length > 0) break;
        
        // Check for node.left or node.right patterns
        if (/\.\s*(left|right)\b/.test(trimmed)) {
          hasNodeAccess = true;
          break;
        }
      }
      
      if (hasNodeAccess) {
        funcLine = i;
        funcName = match[1];
        funcIndent = indent;
        break;
      }
    }
  }
  
  if (funcLine === -1) {
    return { error: "Could not find a traversal function. Make sure your function accesses node.left or node.right." };
  }
  
  // Find the end of the function (where indentation returns to function level or less)
  let closeLine = lines.length - 1;
  const bodyIndent = funcIndent + 1; // Minimum indent for function body
  
  for (let i = funcLine + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue; // Skip empty lines
    
    const lineIndent = lines[i].search(/\S/);
    
    // If this line has less or equal indentation to function def AND it's not empty, function ended
    if (lineIndent <= funcIndent) {
      closeLine = i - 1;
      // Backtrack to find last non-empty line
      while (closeLine > funcLine && !lines[closeLine].trim()) {
        closeLine--;
      }
      break;
    }
  }
  
  const actions: CustomAction[] = [];
  let baseCaseLine = funcLine;
  
  // Parse the function body
  for (let i = funcLine + 1; i <= closeLine; i++) {
    const raw = lines[i];
    const t = raw.trim();
    
    if (!t || t.startsWith("#")) continue;
    
    // Base case: if node is None: return / if not node: return
    if (/if\s+(not\s+\w+|\w+\s+(is\s+None|==\s*None|is\s+not|!=))/i.test(t) && /return/.test(t)) {
      baseCaseLine = i;
      continue;
    }
    // Multi-line base case: if node is None:
    if (/if\s+(not\s+\w+|\w+\s+(is\s+None|==\s*None))\s*:\s*$/.test(t)) {
      baseCaseLine = i;
      continue;
    }
    // The return part of base case
    if (t === "return" || t === "return None") {
      continue;
    }
    
    // Recursive calls: funcName(node.left) or funcName(node.right)
    // Also handles self.funcName(node.left) for class methods
    const callPattern = new RegExp(`(?:self\\.)?${funcName}\\s*\\(\\s*\\w+\\.(left|right)\\s*\\)`);
    const callMatch = t.match(callPattern);
    if (callMatch) {
      actions.push({ kind: callMatch[1] === "left" ? "left" : "right", line: i });
      continue;
    }
    
    // Also check for general recursive patterns like traverse(node.left)
    const generalCallMatch = t.match(/(\w+)\s*\(\s*\w+\.(left|right)\s*\)/);
    if (generalCallMatch && generalCallMatch[1] === funcName) {
      actions.push({ kind: generalCallMatch[2] === "left" ? "left" : "right", line: i });
      continue;
    }
    
    // Visit patterns: print(), result.append(), visit(), yield, etc.
    // Must reference the node variable
    if (
      (/(print\s*\(|\.append\s*\(|\.add\s*\(|visit\s*\(|yield\s+|result\s*[+=]|output\s*[+=]|ans\s*[+=])/.test(t)) &&
      /\b(node|root|curr|current|n)\b/.test(t)
    ) {
      actions.push({ kind: "visit", line: i });
      continue;
    }
    
    // Also catch simple variable assignments that store node value
    if (/=.*\b(node|root|curr|current|n)\.(val|value|data)\b/.test(t) && !/\.(left|right)/.test(t)) {
      actions.push({ kind: "visit", line: i });
      continue;
    }
  }

  if (actions.length === 0) {
    return { 
      error: "No traversal actions detected. Your function should:\n• Call itself with node.left and/or node.right\n• Print or collect the node value (print, append, yield, etc.)" 
    };
  }

  return { 
    program: { 
      actions, 
      funcName, 
      baseCaseLine, 
      openLine: funcLine, 
      closeLine, 
      sourceLines: lines 
    } 
  };
}

export function customTraversalSteps(nodes: TreeNode[], rootId: number, program: CustomProgram): TreeStep[] {
  const steps: TreeStep[] = [];
  function go(id: number | null, parentId: number | null) {
    if (id === null) {
      steps.push({
        type: "nullChild",
        nodeId: null,
        parentId,
        description: parentId !== null ? `None child of ${nodes[parentId].value} → return` : `None root → return`,
        line: program.baseCaseLine,
      });
      return;
    }
    const n = nodes[id];
    steps.push({
      type: "enter",
      nodeId: id,
      parentId,
      edge: parentId !== null ? [parentId, id] : undefined,
      description: `Enter node ${n.value}`,
      line: program.openLine,
    });
    for (const act of program.actions) {
      if (act.kind === "left") {
        steps.push({ type: "goLeft", nodeId: id, description: `Go left from ${n.value}`, line: act.line });
        go(n.left, id);
      } else if (act.kind === "right") {
        steps.push({ type: "goRight", nodeId: id, description: `Go right from ${n.value}`, line: act.line });
        go(n.right, id);
      } else {
        steps.push({ type: "visit", nodeId: id, output: n.value, description: `Visit ${n.value}`, line: act.line });
      }
    }
    steps.push({
      type: "backtrack",
      nodeId: id,
      parentId,
      edge: parentId !== null ? [parentId, id] : undefined,
      description: `Backtrack from ${n.value}`,
      line: program.closeLine,
    });
  }
  go(rootId, null);
  return steps;
}

export function traversalSteps(
  nodes: TreeNode[],
  rootId: number,
  kind: TraversalKind,
): TreeStep[] {
  const steps: TreeStep[] = [];

  function go(id: number | null, parentId: number | null) {
    if (id === null) {
      steps.push({
        type: "nullChild",
        nodeId: null,
        parentId,
        description: parentId !== null
          ? `None child of node ${nodes[parentId].value} → return`
          : `None root → return`,
        line: 1,
      });
      return;
    }
    const n = nodes[id];
    steps.push({
      type: "enter",
      nodeId: id,
      parentId,
      edge: parentId !== null ? [parentId, id] : undefined,
      description: `Enter node ${n.value}`,
      line: 0,
    });

    if (kind === "preorder") {
      steps.push({ type: "visit", nodeId: id, output: n.value, description: `Visit ${n.value}`, line: 2 });
      steps.push({ type: "goLeft", nodeId: id, description: `Go left from ${n.value}`, line: 3 });
      go(n.left, id);
      steps.push({ type: "goRight", nodeId: id, description: `Go right from ${n.value}`, line: 4 });
      go(n.right, id);
    } else if (kind === "inorder") {
      steps.push({ type: "goLeft", nodeId: id, description: `Go left from ${n.value}`, line: 2 });
      go(n.left, id);
      steps.push({ type: "visit", nodeId: id, output: n.value, description: `Visit ${n.value}`, line: 3 });
      steps.push({ type: "goRight", nodeId: id, description: `Go right from ${n.value}`, line: 4 });
      go(n.right, id);
    } else {
      // postorder
      steps.push({ type: "goLeft", nodeId: id, description: `Go left from ${n.value}`, line: 2 });
      go(n.left, id);
      steps.push({ type: "goRight", nodeId: id, description: `Go right from ${n.value}`, line: 3 });
      go(n.right, id);
      steps.push({ type: "visit", nodeId: id, output: n.value, description: `Visit ${n.value}`, line: 4 });
    }

    steps.push({
      type: "backtrack",
      nodeId: id,
      parentId,
      edge: parentId !== null ? [parentId, id] : undefined,
      description: `Backtrack from ${n.value}`,
      line: 5,
    });
  }

  go(rootId, null);
  return steps;
}

// ---------- C++ custom traversal parser ----------
export const DEFAULT_CPP_CODE = `void traverse(Node* node) {
    if (node == nullptr) {
        return;
    }
    traverse(node->left);
    std::cout << node->val << ' ';
    traverse(node->right);
}`;

export function parseCppTraversal(source: string): { program?: CustomProgram; error?: string } {
  const lines = source.split("\n");
  const funcPattern = /^\s*[\w:\<\>\s\*&]+\s+(\w+)\s*\(\s*[\w:\<\>\s\*&]+\s+(\w+)\s*\)\s*\{/;

  let funcLine = -1;
  let funcName = "";
  let paramName = "";

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcPattern);
    if (match) {
      funcLine = i;
      funcName = match[1];
      paramName = match[2];
      break;
    }
  }

  if (funcLine === -1) {
    return { error: "Could not find a C++ traversal function. Use a function like `void traverse(Node* node) { ... }`." };
  }

  let braceCount = 0;
  let closeLine = lines.length - 1;
  for (let i = funcLine; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === "{") braceCount++;
      if (char === "}") braceCount--;
    }
    if (i > funcLine && braceCount === 0) {
      closeLine = i;
      break;
    }
  }

  if (braceCount !== 0) {
    return { error: "Mismatched braces in C++ code. Please check your function body." };
  }

  const actions: CustomAction[] = [];
  let baseCaseLine = funcLine;

  const callPattern = new RegExp(`(?:\\b${funcName}\\s*\\(\\s*(?:this->)?${paramName}\\s*->\\s*(left|right)\\s*\\))`);
  const generalCallPattern = new RegExp(`\\b${funcName}\\s*\\(\\s*(?:${paramName}\\s*->\\s*(left|right))\\s*\\)`);
  const visitFieldPattern = new RegExp(`\\b${paramName}\\s*->\\s*(?:val|value|data)\\b`);
  const coutPattern = new RegExp(`(?:std::\\s*cout|cout)\\s*<<`);
  const pushBackPattern = /\.push_back\s*\(|\.emplace_back\s*\(/;

  for (let i = funcLine + 1; i < closeLine; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t || t.startsWith("//")) continue;

    if (/\bif\b/.test(t) && /return\b/.test(t) && new RegExp(`\\b${paramName}\\b`).test(t) && /(!\s*${paramName}|${paramName}\s*==\s*(?:nullptr|NULL|0)|nullptr\s*==\s*${paramName})/.test(t)) {
      baseCaseLine = i;
      continue;
    }

    const callMatch = t.match(callPattern);
    if (callMatch) {
      actions.push({ kind: callMatch[1] === "left" ? "left" : "right", line: i });
      continue;
    }

    const generalCallMatch = t.match(generalCallPattern);
    if (generalCallMatch) {
      actions.push({ kind: generalCallMatch[1] === "left" ? "left" : "right", line: i });
      continue;
    }

    if (visitFieldPattern.test(t) && (coutPattern.test(t) || pushBackPattern.test(t) || /\bresult\b|\boutput\b|\bans\b/.test(t))) {
      actions.push({ kind: "visit", line: i });
      continue;
    }

    if (visitFieldPattern.test(t) && /\bvisit\b/.test(t)) {
      actions.push({ kind: "visit", line: i });
      continue;
    }
  }

  if (actions.length === 0) {
    return {
      error: "No traversal actions detected. Your C++ function should call itself with node->left and/or node->right, and print or collect node->val."
    };
  }

  return {
    program: {
      actions,
      funcName,
      baseCaseLine,
      openLine: funcLine,
      closeLine,
      sourceLines: lines,
    }
  };
}
