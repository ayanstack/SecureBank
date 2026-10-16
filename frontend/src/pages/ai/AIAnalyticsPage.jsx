import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

export const AIAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/ai/expenses');
      if (res.data?.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Calculating deterministic expense analytics..." />;
  }

  const current = analytics?.currentMonth;
  const previous = analytics?.previousMonth;
  const categories = analytics?.categoryBreakdown || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1F3A] to-[#0D274D] border border-[#1E4578] shadow-panel">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D62839]/15 border border-[#D62839]/30 text-xs font-semibold text-[#D62839] mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>AI Expense Analytics</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F7FAFF] tracking-tight">Financial Intelligence & Spending</h2>
          <p className="text-xs sm:text-sm text-[#94B4DB] mt-1">
            Deterministic categorization derived from your verified ledger transactions.
          </p>
        </div>
      </div>

      {/* AI Commentary Insight Banner */}
      {analytics?.aiInsight && (
        <div className="p-4 rounded-xl bg-[#0D274D] border border-[#1E4578] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#D62839]/15 text-[#D62839] flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F7FAFF] uppercase tracking-wider">Automated Financial Insight</h4>
            <p className="text-xs sm:text-sm text-[#94B4DB] mt-1 leading-relaxed">{analytics.aiInsight}</p>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-[#0D274D] border border-[#1E4578]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94B4DB] uppercase tracking-wider">This Month Debits</span>
              <div className="p-2 rounded-lg bg-[#D62839]/15 text-[#D62839]">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#F7FAFF]">{current?.formattedTotalExpense || '₹0'}</span>
              <p className="text-[11px] text-[#94B4DB] mt-1">
                Last month: {previous?.formattedTotalExpense || '₹0'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D274D] border border-[#1E4578]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94B4DB] uppercase tracking-wider">This Month Credits</span>
              <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#F7FAFF]">{current?.formattedTotalIncome || '₹0'}</span>
              <p className="text-[11px] text-[#94B4DB] mt-1">
                Last month: {previous?.formattedTotalIncome || '₹0'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D274D] border border-[#1E4578]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94B4DB] uppercase tracking-wider">Net Surplus Flow</span>
              <div className="p-2 rounded-lg bg-[#004B8E]/20 text-[#628CBF]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#F7FAFF]">
                {formatCurrency(current?.netSavings || 0)}
              </span>
              <p className="text-[11px] text-[#94B4DB] mt-1">Cash flow balance ratio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Progress Bars */}
      <Card className="bg-[#0D274D] border border-[#1E4578]">
        <CardHeader className="border-b border-[#1E4578]">
          <CardTitle className="text-[#F7FAFF] flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#D62839]" />
            <span>Category Spending Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {categories.length === 0 ? (
            <p className="text-xs text-[#94B4DB] text-center py-8">
              No categorized outgoing transactions recorded for this cycle yet.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, idx) => {
                const total = current?.totalExpense || 1;
                const pct = Math.min(100, Math.round((cat.value / total) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-[#F7FAFF]">
                      <span>{cat.name}</span>
                      <span className="font-mono text-[#D62839]">{cat.formattedValue} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#081526] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D62839] to-[#BA1E2E] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalyticsPage;
