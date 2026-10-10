import { lazy, Suspense } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

// Load language grammars separately, keeping content readable while they load.
const HighlightedMarkdown = lazy(() => import("./HighlightedMarkdown").catch(() => ({ default: MarkdownRenderer })));

export default function MarkdownContent({ children }) {
  return (
    <Suspense fallback={<MarkdownRenderer>{children}</MarkdownRenderer>}>
      <HighlightedMarkdown>{children}</HighlightedMarkdown>
    </Suspense>
  );
}
