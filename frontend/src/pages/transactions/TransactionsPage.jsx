import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Receipt,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { fetchAccounts, setSelectedAccount } from '../../features/accounts/accountSlice';
import { fetchTransactionHistory } from '../../features/transactions/transactionSlice';
import { formatCurrency, formatDateTime, formatDateOnly, maskAccountNumber } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const TransactionsPage = () => {
  const dispatch = useDispatch();

  const { accounts, selectedAccount } = useSelector((state) => state.accounts);
  const { transactions, pagination, isLoading } = useSelector((state) => state.transactions);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);

  // AI Natural Language Search states
  const [isAiSearchMode, setIsAiSearchMode] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState(null);

  const handleAiSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsAiSearching(true);
    setAiSearchResults(null);
    setAiSearchSummary(null);

    try {
      const res = await api.post('/ai/search-transactions', { query: searchQuery.trim() });
      if (res.data?.success) {
        setAiSearchResults(res.data.transactions || []);
        setAiSearchSummary({
          count: res.data.count,
          totalCalculated: res.data.totalCalculated,
          formattedTotal: res.data.formattedTotal,
          dateRangeApplied: res.data.dateRangeApplied,
          appliedFilters: res.data.appliedFilters,
        });
      }
    } catch (err) {
      console.error('AI Search failed:', err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleClearAiSearch = () => {
    setAiSearchResults(null);
    setAiSearchSummary(null);
    setSearchQuery('');
  };

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const activeAccount =
    selectedAccount || (accounts && accounts.length > 0 ? accounts[0] : null);

  const activeAccountId = activeAccount ? activeAccount.id || activeAccount._id : null;

  useEffect(() => {
    if (activeAccountId) {
      dispatch(
        fetchTransactionHistory({
          accountId: activeAccountId,
          type: filterType || undefined,
          status: filterStatus || undefined,
          page: currentPage,
          limit: 15,
        })
      );
    }
  }, [dispatch, activeAccountId, filterType, filterStatus, currentPage]);

  const handleAccountChange = (e) => {
    const acc = accounts.find((a) => (a.id || a._id) === e.target.value);
    if (acc) {
      dispatch(setSelectedAccount(acc));
      setCurrentPage(1);
    }
  };

  const displayedTransactions = aiSearchResults !== null
    ? aiSearchResults
    : transactions.filter((tx) => {
        if (!searchQuery.trim() || isAiSearchMode) return true;
        const q = searchQuery.toLowerCase();
        return (
          tx.description?.toLowerCase().includes(q) ||
          tx.reference?.toLowerCase().includes(q) ||
          tx.transactionId?.toLowerCase().includes(q) ||
          tx.type?.toLowerCase().includes(q)
        );
      });

  return (
    <div className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
            Transaction Activity
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Audit logs, cash-flows, and historical debits/credits across your accounts.
          </p>
        </div>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-brand-border shadow-sm">
            <CreditCard className="w-4 h-4 text-brand-blue" />
            <select
              value={activeAccountId || ''}
              onChange={handleAccountChange}
              className="text-xs font-semibold text-brand-dark bg-transparent focus:outline-none cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id || acc._id} value={acc.id || acc._id}>
                  {acc.accountType} — {maskAccountNumber(acc.accountNumber)} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isAiSearchMode) {
                  handleAiSearch();
                }
              }}
              className="flex-1 w-full flex items-center gap-2 bg-brand-bg px-3.5 py-2 rounded-xl border border-brand-border"
            >
              {isAiSearchMode ? (
                <Sparkles className="w-4 h-4 text-[#D62839] flex-shrink-0 animate-pulse" />
              ) : (
                <Search className="w-4 h-4 text-brand-muted flex-shrink-0" />
              )}
              <input
                type="text"
                placeholder={
                  isAiSearchMode
                    ? "Ask in natural language e.g. 'Show transfers above 2000' or 'Failed transactions'..."
                    : "Search transactions by remarks or reference ID..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-brand-dark bg-transparent focus:outline-none placeholder-brand-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={isAiSearchMode ? handleClearAiSearch : () => setSearchQuery('')}
                  className="text-xs text-brand-muted hover:text-brand-dark"
                >
                  Clear
                </button>
              )}
              {isAiSearchMode && (
                <button
                  type="submit"
                  disabled={isAiSearching || !searchQuery.trim()}
                  className="px-3 py-1 rounded-lg bg-[#D62839] hover:bg-[#BA1E2E] text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  {isAiSearching ? 'Searching...' : 'Ask AI'}
                </button>
              )}
            </form>

            {/* AI Search Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMode = !isAiSearchMode;
                setIsAiSearchMode(nextMode);
                if (!nextMode) {
                  handleClearAiSearch();
                }
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isAiSearchMode
                  ? 'bg-[#D62839]/15 border-[#D62839] text-[#D62839] shadow-sm'
                  : 'bg-white border-brand-border text-brand-muted hover:text-brand-dark'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiSearchMode ? 'AI Search Active' : 'Enable AI Search'}</span>
            </button>

            {/* Standard Filters (hidden when AI search results are active) */}
            {!isAiSearchMode && (
              <div className="w-full md:w-auto flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-44 py-2.5 px-3 rounded-xl border border-brand-border bg-white text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="">All Types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="TRANSFER_OUT">Transfer (Debit)</option>
                  <option value="TRANSFER_IN">Transfer (Credit)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-40 py-2.5 px-3 rounded-xl border border-brand-border bg-white text-xs font-medium text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            )}
          </div>

          {/* AI Search Prompt Suggestions & Active Summary Banner */}
          {isAiSearchMode && (
            <div className="space-y-2 pt-2 border-t border-brand-border/60">
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-brand-muted">
                <span className="font-semibold text-brand-dark flex-shrink-0">Try queries:</span>
                {[
                  'Transfers above 2000',
                  'Failed transactions',
                  'Recent deposits',
                  'Electricity and bills',
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(sample);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-brand-bg hover:bg-slate-200 border border-brand-border flex-shrink-0 text-brand-dark font-medium transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {aiSearchSummary && (
                <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D62839]" />
                    <span>
                      AI Query Matched <strong>{aiSearchSummary.count}</strong> authorized transactions.
                    </span>
                    {aiSearchSummary.formattedTotal && (
                      <span className="px-2 py-0.5 rounded bg-[#D62839]/20 text-[#D62839] font-bold">
                        Calculated Total: {aiSearchSummary.formattedTotal}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearAiSearch}
                    className="text-[11px] text-slate-400 hover:text-white underline self-start sm:self-auto"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading && transactions.length === 0 ? (
            <LoadingSpinner message="Fetching transactions record..." />
          ) : displayedTransactions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No transactions found"
              description="No transaction records match your selected filters."
              actionLabel={filterType || filterStatus || searchQuery || isAiSearchMode ? 'Reset Filters' : undefined}
              onAction={() => {
                setFilterType('');
                setFilterStatus('');
                setSearchQuery('');
                handleClearAiSearch();
              }}
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/70 text-[11px] uppercase tracking-wider text-brand-muted border-b border-brand-border">
                    <th className="py-3.5 px-5 font-semibold">Date & Time</th>
                    <th className="py-3.5 px-5 font-semibold">Transaction Details</th>
                    <th className="py-3.5 px-5 font-semibold">Type</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Amount (₹)</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Balance After</th>
                    <th className="py-3.5 px-5 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-5 font-semibold text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {displayedTransactions.map((tx) => {
                    const isCredit =
                      tx.type === 'DEPOSIT' ||
                      tx.type === 'TRANSFER_IN' ||
                      tx.type === 'INTEREST';

                    return (
                      <tr
                        key={tx.id || tx._id || tx.transactionId}
                        className="hover:bg-brand-light/30 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-brand-muted whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-brand-dark max-w-xs truncate">
                          {tx.description || 'Banking Transaction'}
                          {tx.transactionId && (
                            <span className="block text-[10px] text-brand-muted/80 font-mono mt-0.5">
                              ID: {tx.transactionId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-[11px] font-medium text-brand-muted">
                            {tx.type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-bold whitespace-nowrap ${
                            isCredit ? 'text-brand-success' : 'text-brand-accent'
                          }`}
                        >
                          {isCredit ? '+ CR ' : '- DR '}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-medium text-brand-dark whitespace-nowrap">
                          {tx.balanceAfter !== undefined
                            ? formatCurrency(tx.balanceAfter)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <Badge
                            variant={
                              tx.status === 'COMPLETED'
                                ? 'success'
                                : tx.status === 'FAILED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="xs"
                          >
                            {tx.status || 'COMPLETED'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-light transition-colors"
                            title="View Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-brand-border flex items-center justify-between bg-brand-bg/40 text-xs">
              <span className="text-brand-muted">
                Page {pagination.currentPage} of {pagination.totalPages} (
                {pagination.totalTransactions} Total)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                  className="py-1 px-2.5 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  icon={ChevronRight}
                  iconPosition="right"
                  className="py-1 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="Transaction Audit Receipt"
        description="Complete bank transaction record and balance impact"
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-brand-light text-center border border-brand-border">
              <span className="text-xs text-brand-muted block uppercase">Amount</span>
              <span
                className={`text-2xl font-extrabold block mt-0.5 ${
                  selectedTx.type?.includes('DEPOSIT') || selectedTx.type?.includes('IN')
                    ? 'text-brand-success'
                    : 'text-brand-accent'
                }`}
              >
                {formatCurrency(selectedTx.amount)}
              </span>
              <span className="inline-block mt-1">
                <Badge
                  variant={selectedTx.status === 'COMPLETED' ? 'success' : 'warning'}
                  size="xs"
                >
                  {selectedTx.status || 'COMPLETED'}
                </Badge>
              </span>
            </div>

            <div className="divide-y divide-brand-border bg-white rounded-xl border border-brand-border p-3.5 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Transaction ID:</span>
                <span className="font-mono font-semibold text-brand-dark">
                  {selectedTx.transactionId || selectedTx.id}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Type:</span>
                <span className="font-semibold text-brand-dark">
                  {selectedTx.type?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Description:</span>
                <span className="font-semibold text-brand-dark">{selectedTx.description}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Date & Time:</span>
                <span className="font-semibold text-brand-dark">
                  {formatDateTime(selectedTx.createdAt)}
                </span>
              </div>
              {selectedTx.balanceBefore !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-brand-muted">Balance Before:</span>
                  <span className="font-mono text-brand-dark">
                    {formatCurrency(selectedTx.balanceBefore)}
                  </span>
                </div>
              )}
              {selectedTx.balanceAfter !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-brand-muted">Balance After:</span>
                  <span className="font-mono font-bold text-brand-dark">
                    {formatCurrency(selectedTx.balanceAfter)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="md" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;
