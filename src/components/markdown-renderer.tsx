"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Code block with copy button
const CodeBlock = memo(({
  language,
  children,
}: {
  language: string | undefined;
  children: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-300" />
          )}
        </Button>
      </div>
      {language && (
        <div className="absolute left-4 top-0 -translate-y-1/2 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-800 rounded">
          {language}
        </div>
      )}
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        className="rounded-lg !mt-0 !bg-gray-900"
        customStyle={{
          margin: 0,
          padding: "1.5rem 1rem 1rem",
          fontSize: "0.875rem",
          borderRadius: "0.5rem",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

// Inline code style
const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 mx-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded">
    {children}
  </code>
);

export const MarkdownRenderer = memo(({ content, className = "" }: MarkdownRendererProps) => {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Code blocks
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (!inline && (match || codeString.includes("\n"))) {
            return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
          }

          return <InlineCode {...props}>{children}</InlineCode>;
        },

        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">
            {children}
          </h3>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="mb-3 leading-relaxed text-gray-800 dark:text-gray-200">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">{children}</li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {children}
          </a>
        ),

        // Bold & Italic
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-4 border-gray-300 dark:border-gray-700" />
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-300 dark:border-gray-700">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
            {children}
          </td>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ""}
            className="rounded-lg max-w-full h-auto my-4"
            loading="lazy"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";

export default MarkdownRenderer;
