import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Download,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your CoinCraft AI Banking Assistant. I can securely check your balances, analyze monthly expenditures, list recent transactions, and guide you on statements. How can I help you today?',
      verifiedFacts: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = async (text, index) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy response:', err);
    }
  };

  const samplePrompts = [
    'What is my available balance?',
    'Show my 5 latest transactions',
    'Summarize my monthly spending',
    'Who are my registered beneficiaries?',
    'How do I download my bank statement?',
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      role: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: query.trim() });
      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.reply,
            data: res.data.data,
            verifiedFacts: res.data.verifiedFacts,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Service Advisory: ${getErrorMessage(err)}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-text">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1F3A] to-[#0D274D] border border-[#1E4578] shadow-panel">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D62839]/15 border border-[#D62839]/30 text-xs font-semibold text-[#D62839] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Banking Intelligence</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F7FAFF] tracking-tight">AI Financial Assistant</h2>
          <p className="text-xs sm:text-sm text-[#94B4DB] mt-1">
            Deterministic data verification scoped strictly to your authorized retail accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#10B981] bg-[#10B981]/15 px-3 py-1.5 rounded-lg border border-[#10B981]/30 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Leakage Architecture</span>
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="flex-shrink-0 text-xs px-3.5 py-2 rounded-xl bg-[#0D274D] border border-[#1E4578] text-[#94B4DB] hover:text-[#F7FAFF] hover:border-[#D62839] hover:bg-[#12325E] transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Conversation Card */}
      <Card className="h-[520px] flex flex-col justify-between bg-[#0D274D] border border-[#1E4578]">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                    isUser ? 'bg-[#D62839]' : 'bg-[#12325E] border border-[#1E4578]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#D62839]" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group select-text ${
                    isUser
                      ? 'bg-[#D62839] text-white shadow-glow-red rounded-tr-none'
                      : 'bg-[#081526] text-[#F7FAFF] border border-[#1E4578] rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line select-text">{msg.text}</p>
                  <div className="mt-2 flex items-center justify-between gap-4 text-[10px] text-[#94B4DB]/80 pt-1 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span>{msg.time}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, index)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-[#94B4DB] hover:text-white transition-colors"
                          title="Copy response to clipboard"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 text-[#10B981]" />
                              <span className="text-[#10B981] font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {msg.verifiedFacts && (
                      <span className="flex items-center gap-1 text-[#10B981]">
                        <ShieldCheck className="w-3 h-3" /> Verified Database Fact
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#12325E] border border-[#1E4578] flex items-center justify-center text-white">
                <Bot className="w-4 h-4 text-[#D62839]" />
              </div>
              <div className="bg-[#081526] text-[#94B4DB] border border-[#1E4578] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D62839] animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D62839] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D62839] animate-bounce [animation-delay:0.4s]"></span>
                <span>Synthesizing authorized bank data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#081526]/80 border-t border-[#1E4578]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your accounts, spending, or transfers..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-[#081526] border border-[#1E4578] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#F7FAFF] placeholder-[#628CBF] focus:outline-none focus:border-[#D62839] focus:ring-1 focus:ring-[#D62839]"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !inputQuery.trim()}
              icon={Send}
              className="shadow-glow-red px-5 py-3"
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistantPage;
