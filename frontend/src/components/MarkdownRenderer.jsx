import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

const remarkPlugins = [remarkGfm];

function codeText(node) {
  if (node.type === "text") return node.value;
  return (node.children || []).map(codeText).join("");
}

const components = {
  pre({ node, children }) {
    const code = node.children.find(child => child.tagName === "code");
    const text = codeText(code || node);
    const classes = code?.properties?.className || [];
    const language = classes.find(name => name.startsWith("language-"))?.slice(9);
    return <CodeBlock key={text + language} text={text} language={language}>{children}</CodeBlock>;
  },
  table({ children, ...props }) {
    const { node, ...tableProps } = props;
    void node;
    return (
      <div className="markdown-table-scroll" tabIndex={0} role="region" aria-label="表格，可横向滚动">
        <table {...tableProps}>{children}</table>
      </div>
    );
  },
};

export default function MarkdownRenderer({ children, rehypePlugins }) {
  return <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>{children}</ReactMarkdown>;
}
