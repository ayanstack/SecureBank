import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

export const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');

  const [aiSummary, setAiSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleGenerateSummary = async (ticketId) => {
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const res = await api.post(`/support/${ticketId}/ai-summary`);
      if (res.data?.success) {
        setAiSummary(res.data.summary);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSummarizing(false);
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/support');
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/support', {
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });
      setIsNewModalOpen(false);
      setSubject('');
      setMessage('');
      loadTickets();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const res = await api.post(`/support/${selectedTicket._id}/messages`, {
        content: replyText.trim(),
      });
      if (res.data?.success) {
        setSelectedTicket(res.data.ticket);
        setReplyText('');
        loadTickets();
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Accessing customer support desk..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1F3A] to-[#0D274D] border border-[#1E4578] shadow-panel">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D62839]/15 border border-[#D62839]/30 text-xs font-semibold text-[#D62839] mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>24x7 Customer Desk</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F7FAFF] tracking-tight">Customer Support & Queries</h2>
          <p className="text-xs sm:text-sm text-[#94B4DB] mt-1">
            Official ticket logging and resolution desk. Helpline: +91 6267239091
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsNewModalOpen(true)}
          icon={PlusCircle}
          className="shadow-glow-red"
        >
          Raise Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-[#F7FAFF] uppercase tracking-wider mb-2">My Open Inquiries</h3>
          {tickets.length === 0 ? (
            <Card className="bg-[#0D274D] border border-[#1E4578] p-6 text-center text-xs text-[#94B4DB]">
              No active support tickets logged.
            </Card>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket?._id === t._id
                    ? 'bg-[#12325E] border-[#D62839] text-[#F7FAFF]'
                    : 'bg-[#0D274D] border-[#1E4578] text-[#94B4DB] hover:bg-[#12325E]/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#D62839]">{t.ticketNumber}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      t.status === 'RESOLVED' || t.status === 'CLOSED'
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : 'bg-[#D62839]/20 text-[#D62839]'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#F7FAFF] mt-1 line-clamp-1">{t.subject}</h4>
                <p className="text-[11px] text-[#94B4DB] mt-1">{formatDateTime(t.createdAt)}</p>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Conversation */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="bg-[#0D274D] border border-[#1E4578] flex flex-col h-[520px] justify-between">
              <CardHeader className="border-b border-[#1E4578] flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#D62839]">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs text-[#94B4DB]">[{selectedTicket.category}]</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F7FAFF] mt-0.5">{selectedTicket.subject}</h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateSummary(selectedTicket._id)}
                  isLoading={isSummarizing}
                  icon={Sparkles}
                  className="text-xs"
                >
                  AI Triage & Summary
                </Button>
              </CardHeader>

              {/* AI Summary Banner */}
              {aiSummary && (
                <div className="p-3.5 mx-4 mt-3 rounded-xl bg-[#081526] border border-[#1E4578] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#D62839] font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Automated Triage Summary ({aiSummary.aiProviderStatus})</span>
                    </div>
                    <span className="text-[#94B4DB] font-semibold">{aiSummary.priority} Priority</span>
                  </div>
                  <p className="text-[#F7FAFF] leading-relaxed">{aiSummary.summaryText}</p>
                  <div className="pt-1 text-[11px] text-[#94B4DB] border-t border-[#1E4578]/60">
                    <strong className="text-emerald-400">Recommended Action:</strong> {aiSummary.recommendedAction}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                      m.sender === 'CUSTOMER'
                        ? 'bg-[#12325E] text-[#F7FAFF] ml-auto border border-[#1E4578]'
                        : 'bg-[#081526] text-[#F7FAFF] border border-[#1E4578]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#94B4DB] mb-1">
                      <span className="font-bold">{m.senderName}</span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="p-3 border-t border-[#1E4578] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#081526] border border-[#1E4578] rounded-xl px-4 py-2.5 text-xs text-[#F7FAFF] focus:outline-none focus:border-[#D62839]"
                />
                <Button type="submit" variant="primary" icon={Send} disabled={!replyText.trim()}>
                  Reply
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="bg-[#0D274D] border border-[#1E4578] h-[520px] flex items-center justify-center p-6 text-center text-xs text-[#94B4DB]">
              Select a ticket from the left panel to inspect updates or send a reply.
            </Card>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Log Customer Inquiry">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Inquiry Subject"
            placeholder="Brief overview of your issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#94B4DB] uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm rounded-lg border border-[#1E4578] py-2.5 px-3 bg-[#081526] text-[#F7FAFF] focus:outline-none focus:border-[#D62839]"
            >
              <option value="Transactions">Transactions & Transfers</option>
              <option value="Account Access">Account Access & Login</option>
              <option value="Cards & PIN">Virtual Card & PIN</option>
              <option value="Fraud & Security">Fraud & Suspicious Anomaly</option>
              <option value="Technical Issue">Technical Glitch</option>
              <option value="General">General Inquiry</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#94B4DB] uppercase tracking-wide">Description</label>
            <textarea
              rows={4}
              placeholder="Provide exact transaction references or error details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full text-xs rounded-lg border border-[#1E4578] p-3 bg-[#081526] text-[#F7FAFF] placeholder-[#628CBF] focus:outline-none focus:border-[#D62839]"
            />
          </div>
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E4578]">
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupportPage;
