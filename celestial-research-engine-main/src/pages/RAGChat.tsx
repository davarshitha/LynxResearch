import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp?: string;
}

interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

const formatTime = (ts?: string) => {
  if (!ts) return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// Simple markdown-lite renderer: bold, inline code, newlines
const renderContent = (content: string) => {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={j} className="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-700/60 rounded-2xl rounded-tl-sm">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
    </div>
  </div>
);

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5 ${
          isUser ? "bg-blue-600 text-white" : "bg-purple-700 text-purple-200"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-gray-700/70 text-gray-100 rounded-tl-sm border border-gray-600/40"
          }`}
        >
          {renderContent(msg.content)}
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full mt-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              Sources
            </p>
            {msg.sources.map((src, i) => (
              <a
                key={i}
                href={src.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-0.5 p-2.5 rounded-lg border border-gray-600/40 bg-gray-800/60 hover:border-purple-500/40 hover:bg-gray-700/60 transition-colors"
              >
                <span className="text-xs font-medium text-purple-300 truncate">
                  {src.title || src.url || `Source ${i + 1}`}
                </span>
                {src.snippet && (
                  <span className="text-[11px] text-gray-400 line-clamp-2">{src.snippet}</span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-500">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
};

const SUGGESTED_QUESTIONS = [
  "Summarize the key findings",
  "What are the main conclusions?",
  "List the most important sources",
  "What gaps exist in this research?",
];

const RAGChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/chat/${id}`)
      .then((res) => {
        const msgs = Array.isArray(res.data) ? res.data : res.data.messages || [];
        setMessages(msgs);
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`http://localhost:8000/chat/${id}`, {
        question: content,
        conversation_history: updatedMessages,
      });

      const botMessage: Message = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1">
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            RAG Chat
          </h1>
          {id && (
            <p className="text-[11px] font-mono text-gray-500">Run #{String(id).slice(0, 8)}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          RAG Enabled
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-700/60 bg-gray-800/30 p-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-700/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-300 font-medium">Ask anything about this research</p>
              <p className="text-gray-500 text-sm mt-1">Powered by your indexed documents</p>
            </div>

            {/* Suggested questions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs text-gray-300 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/40 hover:border-gray-500 rounded-lg px-3 py-2.5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Suggested questions row (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 shrink-0">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="shrink-0 text-xs text-gray-400 hover:text-purple-300 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/60 hover:border-purple-500/30 rounded-full px-3 py-1.5 transition-all whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="mt-2 flex gap-2 items-end shrink-0">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask something about this research… (Enter to send)"
            className="w-full resize-none bg-gray-800 border border-gray-600 hover:border-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: "48px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
        </div>

        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default RAGChat;