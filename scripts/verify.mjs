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

function testBuildArtifacts() {
  assert.ok(fs.existsSync(path.join(root, ".next/BUILD_ID")));
}

const tests = [
  ["example flow validation", testExampleFlowValidation],
  ["export/import roundtrip", testExportImportRoundtrip],
  ["ContextAi trace example shape", testContextAiTraceShape],
  ["ContextAi catalog snapshot", testCatalogSnapshot],
  ["production build artifacts", testBuildArtifacts],
];

for (const [name, fn] of tests) {
  fn();
  console.log(`✓ ${name}`);
}

console.log(`\nAll ${tests.length} verification checks passed.`);
