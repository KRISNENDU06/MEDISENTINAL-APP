import React, { useState, useRef, useEffect } from 'react';
import { api, AreaSummary } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  Sparkles,
  Stethoscope,
  ShieldAlert,
  HelpCircle,
  Pill,
  Thermometer,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  category?: string;
  suggestedQuestions?: string[];
  relatedActions?: string[];
  timestamp: string;
}

interface AIChatbotWidgetProps {
  selectedArea: AreaSummary | null;
  isOpen: boolean;
  onToggle: () => void;
  onOpenDrillDown?: (area: AreaSummary) => void;
  onToggleSimulator?: () => void;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({
  selectedArea,
  isOpen,
  onToggle,
  onOpenDrillDown,
  onToggleSimulator,
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        "👋 **Namaste! I am the MEDISENTINEL AI Health & Epidemiological Assistant.**\n\n" +
        "You can ask me anything about:\n" +
        "• **Disease Outbreak & Prevention**: Dengue, Cholera, Influenza, Malaria & waterborne illnesses.\n" +
        "• **Public Health SOPs**: Emergency response workflows, ward-level containment & disinfection protocols.\n" +
        "• **Medical Guidelines**: Fever triage, hydration management, symptom escalation warnings.\n" +
        "• **MEDISENTINEL Platform**: 4-pillar risk formula, real-world map, what-if simulator & data ingestion.\n\n" +
        "How can I assist your surveillance or public health response today?",
      category: 'GREETING',
      suggestedQuestions: [
        'Why is Saheed Nagar at High Risk?',
        'What is the Dengue Outbreak Prevention SOP?',
        'How is the 4-Pillar Risk Score calculated?',
        'What is the Waterborne Disease & Diarrhea Protocol?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const res = await api.chatWithAI(query, history, selectedArea?.id);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        category: res.category,
        suggestedQuestions: res.suggested_questions,
        relatedActions: res.related_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text:
          "⚠️ **Surveillance Engine Connection Notice**\n\n" +
          "I could not connect to the backend intelligence engine right now. Please verify that the FastAPI backend server is active on `http://127.0.0.1:8000`.\n\n" +
          "• In the meantime, you can review live telemetry on the **Geospatial Ward Map** or run the **What-If Simulator**.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('info', 'Copied to Clipboard', 'Medical advice copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text:
          "🧹 **Chat history cleared.**\n\n" +
          "Ask me anything about disease outbreak prevention, SOPs, medical triage, or the MEDISENTINEL platform!",
        category: 'GREETING',
        suggestedQuestions: [
          'Why is Saheed Nagar at High Risk?',
          'What is the Dengue Outbreak Prevention SOP?',
          'How is the 4-Pillar Risk Score calculated?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Render markdown with formatting
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic rendering
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Code / monospace rendering
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 rounded text-brand-300 font-mono text-[11px]">$1</code>');

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-slate-200 my-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.substring(2) }}
          />
        );
      }

      if (line.startsWith('### ')) {
        return (
          <h4
            key={idx}
            className="font-bold text-sm text-brand-400 mt-2 mb-1"
            dangerouslySetInnerHTML={{ __html: formatted.substring(4) }}
          />
        );
      }

      if (line.startsWith('## ') || line.startsWith('# ')) {
        return (
          <h3
            key={idx}
            className="font-black text-base text-white mt-2 mb-1"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^#+\s/, '') }}
          />
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p
          key={idx}
          className="my-1 leading-relaxed text-slate-200"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <>
      {/* 1. Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Open MEDISENTINEL AI Health & Epidemiological Assistant"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white font-bold text-xs bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-2xl shadow-emerald-950/70 border border-brand-400/40 transition-all transform hover:scale-105 active:scale-95 group animate-bounce-subtle"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <span className="hidden sm:inline font-black tracking-wide">
            AI Health Assistant
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/20">
            SOP & Outbreak
          </span>
        </button>
      )}

      {/* 2. Chatbot Dialog Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-full max-w-[420px] sm:w-[420px] h-[600px] max-h-[85vh]'
          } glass-panel-glow rounded-3xl bg-slate-900/95 shadow-2xl border border-slate-700/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    MEDISENTINEL AI Assistant
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Disease Outbreak, SOPs & Medical Guidelines
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onToggle}
                title="Close Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Context Bar (if a ward is selected) */}
          {selectedArea && (
            <div className="px-3.5 py-1.5 bg-brand-950/40 border-b border-brand-500/20 flex items-center justify-between text-[11px] text-brand-300">
              <span className="flex items-center gap-1.5 truncate">
                <Info className="w-3 h-3 text-brand-400" />
                Active Context: <strong>{selectedArea.name}</strong> ({selectedArea.riskLevel} Risk)
              </span>
              <button
                onClick={() => handleSendMessage(`What is the epidemiological status and SOP for ${selectedArea.name}?`)}
                className="text-[10px] font-bold text-brand-400 hover:text-white underline ml-2"
              >
                Analyze Ward
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 ${
                      isUser
                        ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white font-medium shadow-md'
                        : 'bg-slate-950/90 text-slate-200 border border-slate-800 shadow-md'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">{formatMarkdown(msg.text)}</div>
                    )}
                  </div>

                  {/* Message Meta & Suggested Follow-up Pills */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        title="Copy Response"
                        className="hover:text-slate-300 flex items-center gap-0.5 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {/* Suggested Question Chips (Only on Assistant messages) */}
                  {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 pt-1 max-w-[95%]">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-850 hover:bg-brand-950/60 hover:text-brand-300 text-slate-300 border border-slate-700 hover:border-brand-500/40 transition-all text-left flex items-center gap-1 active:scale-95"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-brand-400" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-3 rounded-2xl bg-slate-950/80 border border-slate-800 w-fit">
                <Bot className="w-4 h-4 text-brand-400 animate-spin" />
                <span className="font-mono">Synthesizing epidemiological intelligence...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar & Clinical Disclaimer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about Dengue SOP, fever triage, risk score, Saheed Nagar..."
                disabled={loading}
                className="flex-1 bg-slate-900 text-xs text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700/80 focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Emergency & Medical Disclaimer */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>National Health Helpline: <strong>104</strong> | Ambulance: <strong>108</strong></span>
              <span className="italic">Clinical Decision Support</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

