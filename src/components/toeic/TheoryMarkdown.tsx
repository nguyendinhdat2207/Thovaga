import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Lý thuyết TOEIC lưu dạng Markdown (bảng GFM nhiều) — map từng thẻ sang class
// theo design token để khớp phần còn lại của app, không dùng plugin typography.
const components: Components = {
  h2: ({ children }) => (
    <h2 className="font-display font-extrabold text-[20px] text-ink mt-8 mb-3 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display font-extrabold text-[17px] text-ink mt-6 mb-2.5">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display font-extrabold text-[15px] text-ink mt-5 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="font-bold text-[15px] leading-relaxed text-ink my-2.5">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2.5 space-y-1 font-bold text-[15px] leading-relaxed text-ink">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2.5 space-y-1 font-bold text-[15px] leading-relaxed text-ink">
      {children}
    </ol>
  ),
  strong: ({ children }) => <strong className="font-extrabold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-2 border-yellow bg-yellow-pale rounded-2xl px-4 py-1 my-3.5 [&_p]:my-2 [&_p]:text-sm">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-badge-bg rounded-md px-1.5 py-0.5 text-[13px]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-badge-bg rounded-xl p-3.5 my-3 overflow-x-auto text-[13px] whitespace-pre-wrap">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[480px] border-collapse text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-badge-bg">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-display font-extrabold text-[13px] text-ink-muted px-3 py-2 border-b border-border align-top">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="font-bold text-ink px-3 py-2 border-b border-track align-top">{children}</td>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-ink">
      {children}
    </a>
  ),
};

export function TheoryMarkdown({ source }: { source: string }) {
  return (
    <div className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
