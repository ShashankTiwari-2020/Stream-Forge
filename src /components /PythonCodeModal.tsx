import React, { useState } from 'react';
import { X, Copy, Check, Code, BookOpen, Terminal, Sparkles } from 'lucide-react';
import { PYTHON_CODE_SNIPPETS } from '../data/pythonCode';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSnippet = PYTHON_CODE_SNIPPETS[selectedSnippetIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Native Python Stream Processing Architecture
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                  Faust + RocksDB + FastAPI REST + Kafka
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pure Python stream processing &amp; REST Interactive Queries with Exactly-Once Semantics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center space-x-1 px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto text-xs">
          {PYTHON_CODE_SNIPPETS.map((snippet, idx) => {
            const isActive = idx === selectedSnippetIndex;
            return (
              <button
                key={snippet.filename}
                onClick={() => {
                  setSelectedSnippetIndex(idx);
                  setCopied(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg font-mono font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                {snippet.filename}
              </button>
            );
          })}
        </div>

        {/* Code Content View */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 flex flex-col font-mono text-xs">
          {/* File description banner */}
          <div className="mb-3 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
            <div>
              <strong className="text-white block font-sans text-sm mb-0.5">
                {currentSnippet.title}
              </strong>
              <p className="text-[11px] text-slate-400 font-sans">
                {currentSnippet.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Code block */}
          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 text-slate-200 overflow-x-auto leading-relaxed scrollbar-thin flex-1 text-[11px]">
            <code>{currentSnippet.code}</code>
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Python 3.12+ &bull; Faust-Streaming &bull; python-rocksdb &bull; aiokafka</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
