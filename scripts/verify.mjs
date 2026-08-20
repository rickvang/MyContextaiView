import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function validateFlowDocument(value) {
  assert.ok(value && typeof value === "object", "flow must be object");
  assert.equal(value.schemaVersion, 1);
  assert.ok(typeof value.id === "string");
  assert.ok(typeof value.name === "string");
  assert.ok(Array.isArray(value.nodes));
  assert.ok(Array.isArray(value.edges));
  for (const node of value.nodes) {
    assert.ok(node.id && node.type && node.position && node.data?.label);
  }
  for (const edge of value.edges) {
    assert.ok(edge.id && edge.source && edge.target);
  }
  return value;
}

function testExampleFlowValidation() {
  const examplePath = path.join(root, "src/data/examples/contextai-route.flow.json");
  const flow = validateFlowDocument(JSON.parse(fs.readFileSync(examplePath, "utf8")));
  assert.equal(flow.nodes.length, 6);
  assert.equal(flow.edges.length, 5);
}

function testExportImportRoundtrip() {
  const examplePath = path.join(root, "src/data/examples/contextai-route.flow.json");
  const flow = validateFlowDocument(JSON.parse(fs.readFileSync(examplePath, "utf8")));
  const roundtrip = validateFlowDocument(JSON.parse(JSON.stringify(flow)));
  assert.equal(roundtrip.name, flow.name);
  assert.equal(roundtrip.nodes.length, flow.nodes.length);
}

function testContextAiTraceShape() {
  const tracePath = path.join(root, "..", "ContextAi", "workflow-trace", "examples", "contextai-route.json");
  const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  assert.ok(trace.route);
  assert.ok(Array.isArray(trace.workflow_steps));
  assert.ok(Array.isArray(trace.operating_models));
  assert.ok(Array.isArray(trace.skills));
  assert.ok(trace.next_handoff);
}

function testCatalogSnapshot() {
  const catalogPath = path.join(root, "src/data/contextai-catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  assert.ok(catalog.operatingModels.length >= 5);
  assert.ok(catalog.skills.length >= 5);
  assert.ok(catalog.operatingModels.includes("Builder"));
  assert.ok(catalog.skills.includes("Record Workflow Trace"));
}

function testWorkspaceFlowMermaid() {
  const mermaidPath = path.join(root, "src/data/contextai-workspace-flow.mmd");
  const source = fs.readFileSync(mermaidPath, "utf8");
  assert.ok(source.includes("flowchart TD"));
  assert.ok(source.includes('A["New user turn"]'));
  assert.ok(source.includes("Conductor selects the smallest sufficient route"));
  assert.ok(source.includes("Record Workflow Trace skill"));
}

function testContractMapFile() {
  const contractsPath = path.join(root, "src/lib/contextai/contracts.ts");
  const source = fs.readFileSync(contractsPath, "utf8");
  assert.ok(source.includes("operating-models/builder/CONTEXT.md"));
  assert.ok(source.includes("skills/coordination/requirements-check/SKILL.md"));
  assert.ok(source.includes("github.com/rickvang/ContextAi"));
}

function testBuildArtifacts() {
  // Prefer a fresh production build artifact when present; otherwise confirm package scripts.
  const manifest = path.join(root, ".next/build-manifest.json");
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(packageJson.scripts?.build, "next build");
  if (fs.existsSync(path.join(root, ".next"))) {
    assert.ok(fs.existsSync(manifest), "Expected .next/build-manifest.json after a production build");
  }
}

const tests = [
  ["example flow validation", testExampleFlowValidation],
  ["export/import roundtrip", testExportImportRoundtrip],
  ["ContextAi trace example shape", testContextAiTraceShape],
  ["ContextAi catalog snapshot", testCatalogSnapshot],
  ["ContextAi workspace flow mermaid", testWorkspaceFlowMermaid],
  ["ContextAi contract map", testContractMapFile],
  ["production build artifacts", testBuildArtifacts],
];

for (const [name, fn] of tests) {
  fn();
  console.log(`✓ ${name}`);
}

console.log(`\nAll ${tests.length} verification checks passed.`);
