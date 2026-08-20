/** App-router paths (Next.js prefixes basePath automatically). */
export function editorHref(flowId: string): string {
  return `/editor/?id=${encodeURIComponent(flowId)}`;
}
