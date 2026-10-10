import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";
import vim from "highlight.js/lib/languages/vim";
import powershell from "highlight.js/lib/languages/powershell";
import MarkdownRenderer from "./MarkdownRenderer";

const rehypePlugins = [[rehypeHighlight, {
  languages: { ...common, vim, powershell },
  detect: false,
  plainText: ["text", "txt", "plaintext"],
}]];

export default function HighlightedMarkdown({ children }) {
  return <MarkdownRenderer rehypePlugins={rehypePlugins}>{children}</MarkdownRenderer>;
}
