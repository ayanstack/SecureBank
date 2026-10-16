import React, { useState, useEffect } from 'react';
import {
  Target,
  PlusCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Award,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';

export const AISavingsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [notes, setNotes] = useState('');

  const loadSavings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/ai/savings');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavings();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || !targetDate) return;

    setIsSubmitting(true);
    try {
      await api.post('/ai/savings/goals', {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        targetDate,
        category,
        notes,
      });
      setIsModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setTargetDate('');
      loadSavings();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Evaluating smart savings plans..." />;
  }

  const goals = data?.goals || [];
  const recommendations = data?.recommendations || [];
  const summary = data?.summary;

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1F3A] to-[#0D274D] border border-[#1E4578] shadow-panel">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D62839]/15 border border-[#D62839]/30 text-xs font-semibold text-[#D62839] mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Smart Savings Advisor</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F7FAFF] tracking-tight">Milestone Goals & Wealth Planning</h2>
          <p className="text-xs sm:text-sm text-[#94B4DB] mt-1">
            Track goals with automated recommendations derived from your verified cash flow.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={PlusCircle}
          className="shadow-glow-red"
        >
          Create Goal
        </Button>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0D274D] border border-[#1E4578] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#D62839]/15 text-[#D62839] flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F7FAFF] uppercase tracking-wider">{rec.title}</h4>
                <p className="text-xs text-[#94B4DB] mt-1 leading-relaxed">{rec.advice}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100));
          const isAchieved = g.status === 'ACHIEVED' || pct >= 100;
          return (
            <Card key={g._id} className="bg-[#0D274D] border border-[#1E4578] text-[#F7FAFF]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94B4DB]">
                      {g.category}
                    </span>
                    <h3 className="text-base font-bold text-[#F7FAFF] mt-0.5">{g.title}</h3>
                  </div>
                  {isAchieved ? (
                    <span className="p-1 rounded bg-[#10B981]/20 text-[#10B981]">
                      <Award className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#D62839]">{pct}%</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#94B4DB]">
                    <span>Accumulated: {formatCurrency(g.currentAmount || 0)}</span>
                    <span>Target: {formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#081526] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-[#10B981]' : 'bg-[#D62839]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1E4578] text-[11px] text-[#94B4DB]">
                  <span>Target Date: {formatDateOnly(g.targetDate)}</span>
                  <span className={isAchieved ? 'text-[#10B981] font-bold' : 'text-[#D62839] font-medium'}>
                    {isAchieved ? 'Goal Completed' : 'In Progress'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal for Creating Goal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Savings Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Liquidity Reserve"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="e.g. 50000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          <Input
            label="Target Completion Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#94B4DB] uppercase tracking-wide">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm rounded-lg border border-[#1E4578] py-2.5 px-3 bg-[#081526] text-[#F7FAFF] focus:outline-none focus:border-[#D62839]"
            >
              <option value="Emergency">Emergency</option>
              <option value="Vacation">Vacation</option>
              <option value="Home">Home</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Education">Education</option>
              <option value="Investment">Investment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E4578]">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Target
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AISavingsPage;
