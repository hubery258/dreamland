import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const remarkPlugins = [remarkGfm];
const components = {
  table({ children, ...props }) {
    // The parser's node metadata is not a DOM attribute.
    const { node, ...tableProps } = props;
    void node;
    return (
      <div className="markdown-table-scroll" tabIndex={0} role="region" aria-label="表格，可横向滚动">
        <table {...tableProps}>{children}</table>
      </div>
    );
  },
};

export default function MarkdownContent({ children }) {
  return <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>{children}</ReactMarkdown>;
}
