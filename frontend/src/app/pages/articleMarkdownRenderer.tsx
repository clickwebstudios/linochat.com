import { ReactNode } from 'react';

export const renderInlineMarkdown = (text: string): ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="font-semibold">{part.slice(2, -2)}</span>;
    }
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((codePart, j) => {
      if (codePart.startsWith('`') && codePart.endsWith('`')) {
        return <code key={`${i}-${j}`} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">{codePart.slice(1, -1)}</code>;
      }
      return <span key={`${i}-${j}`}>{codePart}</span>;
    });
  });
};

export const renderContent = (text: string): ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return <h1 key={i} className="text-2xl mb-4 mt-6 first:mt-0">{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="text-xl mb-3 mt-5">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={i} className="text-lg mb-2 mt-4">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith('- [ ] ')) {
      return (
        <div key={i} className="flex items-center gap-2 py-1 ml-4">
          <div className="h-4 w-4 border rounded border-border" />
          <span className="text-sm">{trimmed.slice(6)}</span>
        </div>
      );
    }
    if (trimmed.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5 ml-4">
          <span className="text-muted-foreground mt-1">&bull;</span>
          <span className="text-sm">{renderInlineMarkdown(trimmed.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        return (
          <div key={i} className="flex items-start gap-2 py-0.5 ml-4">
            <span className="text-muted-foreground min-w-[1.5rem] text-sm">{match[1]}.</span>
            <span className="text-sm">{renderInlineMarkdown(match[2])}</span>
          </div>
        );
      }
    }
    if (trimmed.startsWith('```')) {
      return null;
    }
    if (trimmed === '') {
      return <div key={i} className="h-3" />;
    }
    return <p key={i} className="text-sm text-foreground leading-relaxed">{renderInlineMarkdown(trimmed)}</p>;
  });
};
