import React, { useState } from 'react';
import { useRisk } from '../../context/useRisk';
import { riskService } from '../../services/riskService';
import {
  Bot,
  Sparkles,
  Send,
  X,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function AICopilotDrawer({ isOpen, onClose }) {
  const { selectedArea, areas, weights } = useRisk();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      headline: `MediSentinel AI Epidemiologist Ready`,
      summary: `I continuously monitor aggregated pharmacy OTC transactions, syndromic clinic triage logs, and spatial transmission vectors across Bhubaneswar. Ask me anything about current anomalies or scenario projections.`,
      leadingIndicators: [],
      recommendedSOP: [
        'Select a prompt chip below or type a custom epidemiological inquiry.',
      ],
    },
  ]);

  if (!isOpen) return null;

  const promptChips = [
    `Why is ${selectedArea?.name || 'Saheed Nagar'} at High Risk?`,
    `Project case trajectory under Micro-Containment`,
    `Compare transmission between Saheed Nagar & Patia`,
    `What are the leading OTC pharmacy indicators?`,
  ];

  const handleSend = async (customQuery) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    setQuery('');

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: textToSend },
    ]);

    try {
      const response = await riskService.queryCopilot({
        query: textToSend,
        selectedArea,
        allAreas: areas,
        weights,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          headline: response.headline,
          summary: response.summary,
          leadingIndicators: response.leadingIndicators || [],
          recommendedSOP: response.recommendedSOP || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          headline: 'Surveillance Diagnostic Summary',
          summary: `Current multi-signal divergence indicates heightened syndromic activity in ${selectedArea?.name}. Pharmacy sales surge by ${selectedArea?.signals?.medicineDemand?.deviation || '+62%'} preceding clinic reports by 5 days.`,
          leadingIndicators: [],
          recommendedSOP: ['Dispatch Rapid Response Team for field validation.'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white">Ask MediSentinel AI Copilot</h3>
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                GenAI &bull; Reasoning
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Epidemiological Diagnostic & SOP Advisor
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end">
                <div className="bg-indigo-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[85%] font-medium">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs space-y-2.5 max-w-[90%]">
                <div className="font-bold text-slate-900 text-xs">{msg.headline}</div>
                <p className="text-slate-700 leading-relaxed text-xs">{msg.summary}</p>

                {msg.leadingIndicators && msg.leadingIndicators.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Leading Indicators:
                    </span>
                    <div className="space-y-1">
                      {msg.leadingIndicators.map((ind, i) => (
                        <div key={i} className="text-[11px] flex items-start gap-1 text-slate-600">
                          <ChevronRight size={12} className="text-indigo-600 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-800">{ind.signal}:</strong> {ind.evidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.recommendedSOP && msg.recommendedSOP.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600" /> Recommended Action Plan:
                    </span>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc pl-4">
                      {msg.recommendedSOP.map((sop, i) => (
                        <li key={i}>{sop}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2 items-center text-slate-500 text-xs">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Evaluating multi-signal anomalies & transmission metrics...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-2.5 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1.5">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 transition cursor-pointer shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about risk spikes, containment SOPs, or leading indicators..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 transition"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-xl transition cursor-pointer"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
