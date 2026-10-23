import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText,
  Download,
  Mail,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchAccounts, setSelectedAccount } from '../../features/accounts/accountSlice';
import {
  fetchStatementSummary,
  fetchAccountStatement,
  fetchMiniStatement,
  emailStatement,
  downloadCSVStatement,
  downloadPDFStatement,
} from '../../features/statements/statementSlice';
import { addToast } from '../../features/ui/uiSlice';
import { formatCurrency, formatDateTime, formatDateOnly, maskAccountNumber } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const StatementsPage = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const { accounts, selectedAccount } = useSelector((state) => state.accounts);
  const { summary, miniStatement, statementData, isLoading, isEmailing, emailSuccess } = useSelector(
    (state) => state.statements
  );

  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'mini'
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const activeAccount =
    selectedAccount || (accounts && accounts.length > 0 ? accounts[0] : null);
  const activeAccountId = activeAccount ? activeAccount.id || activeAccount._id : null;

  useEffect(() => {
    if (user?.email) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (activeAccountId) {
      dispatch(fetchStatementSummary(activeAccountId));
      dispatch(fetchMiniStatement(activeAccountId));
      dispatch(fetchAccountStatement({ accountId: activeAccountId, page: 1, limit: 30 }));
    }
  }, [dispatch, activeAccountId]);

  const handleAccountChange = (e) => {
    const acc = accounts.find((a) => (a.id || a._id) === e.target.value);
    if (acc) {
      dispatch(setSelectedAccount(acc));
    }
  };

  const handleDownloadCSV = async () => {
    if (!activeAccountId) return;
    setIsDownloadingCSV(true);
    try {
      await downloadCSVStatement(activeAccountId, activeAccount?.accountNumber);
      dispatch(
        addToast({
          type: 'success',
          title: 'CSV Downloaded',
          message: 'Account statement CSV has been saved to your downloads.',
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: err.message || 'Unable to download CSV statement',
        })
      );
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!activeAccountId) return;
    setIsDownloadingPDF(true);
    try {
      await downloadPDFStatement(activeAccountId, activeAccount?.accountNumber);
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Downloaded',
          message: 'Official PDF statement has been generated and downloaded.',
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: err.message || 'Unable to download PDF statement',
        })
      );
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    const result = await dispatch(
      emailStatement({
        accountId: activeAccountId,
        email: recipientEmail.trim(),
      })
    );

    if (emailStatement.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Statement Emailed',
          message: `Account statement dispatched to ${recipientEmail.trim()}.`,
        })
      );
      setIsEmailModalOpen(false);
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Email Dispatch Failed',
          message: result.payload,
        })
      );
    }
  };

  const transactionsToDisplay =
    activeTab === 'mini' ? miniStatement : statementData.transactions;

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Account Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
            Account Statements
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Download verified account statements or email digital copies.
          </p>
        </div>

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

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted block">
              Total Deposits (CR)
            </span>
            <div className="text-xl font-extrabold text-brand-success mt-1">
              +{formatCurrency(summary.totalCredits || 0)}
            </div>
            <span className="text-[10px] text-brand-muted mt-1 block">
              {summary.creditCount || 0} Inward credits
            </span>
          </Card>

          <Card className="p-4 bg-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted block">
              Total Withdrawals (DR)
            </span>
            <div className="text-xl font-extrabold text-brand-accent mt-1">
              -{formatCurrency(summary.totalDebits || 0)}
            </div>
            <span className="text-[10px] text-brand-muted mt-1 block">
              {summary.debitCount || 0} Outward debits
            </span>
          </Card>

          <Card className="p-4 bg-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted block">
              Net Cash Flow
            </span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                (summary.netCashFlow || 0) >= 0 ? 'text-brand-blue' : 'text-brand-accent'
              }`}
            >
              {(summary.netCashFlow || 0) >= 0 ? '+' : ''}
              {formatCurrency(summary.netCashFlow || 0)}
            </div>
            <span className="text-[10px] text-brand-muted mt-1 block">During period</span>
          </Card>

          <Card className="p-4 bg-brand-light/60 border-brand-blue/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark block">
              Closing Balance
            </span>
            <div className="text-xl font-extrabold text-brand-dark mt-1">
              {formatCurrency(summary.closingBalance || activeAccount?.balance || 0)}
            </div>
            <span className="text-[10px] text-brand-blue font-semibold mt-1 block">
              Verified Ledger
            </span>
          </Card>
        </div>
      )}

      {/* Action Toolbar: CSV / PDF / Email */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-brand-border shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-bg rounded-lg border border-brand-border">
          <button
            type="button"
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'full'
                ? 'bg-white text-brand-blue shadow-sm'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Full Statement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mini')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'mini'
                ? 'bg-white text-brand-blue shadow-sm'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Mini Statement (Latest 5)
          </button>
        </div>

        {/* Download & Email Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            isLoading={isDownloadingCSV}
            icon={FileSpreadsheet}
            className="text-xs"
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            isLoading={isDownloadingPDF}
            icon={Download}
            className="text-xs"
          >
            Download PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEmailModalOpen(true)}
            icon={Mail}
            className="text-xs"
          >
            Email Statement
          </Button>
        </div>
      </div>

      {/* Statement Table Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {activeTab === 'mini' ? 'Mini Statement (Recent 5)' : 'Detailed Account Ledger'}
            </CardTitle>
            <CardDescription>
              Account: {maskAccountNumber(activeAccount?.accountNumber)} ({activeAccount?.accountType})
            </CardDescription>
          </div>
          <span className="text-xs text-brand-muted">
            {transactionsToDisplay.length} Transaction(s)
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && transactionsToDisplay.length === 0 ? (
            <LoadingSpinner message="Generating statement view..." />
          ) : transactionsToDisplay.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No statement transactions found"
              description="No entries exist in the selected account statement period."
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/70 text-[11px] uppercase tracking-wider text-brand-muted border-b border-brand-border">
                    <th className="py-3 px-5 font-semibold">Value Date</th>
                    <th className="py-3 px-5 font-semibold">Transaction Particulars</th>
                    <th className="py-3 px-5 font-semibold">Type</th>
                    <th className="py-3 px-5 font-semibold text-right">Debit (DR)</th>
                    <th className="py-3 px-5 font-semibold text-right">Credit (CR)</th>
                    <th className="py-3 px-5 font-semibold text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {transactionsToDisplay.map((tx) => {
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
                          {formatDateOnly(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-brand-dark max-w-sm truncate">
                          {tx.description || 'Transaction'}
                        </td>
                        <td className="py-3.5 px-5 text-brand-muted text-[11px]">
                          {tx.type?.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold text-brand-accent whitespace-nowrap">
                          {!isCredit ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold text-brand-success whitespace-nowrap">
                          {isCredit ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-brand-dark whitespace-nowrap">
                          {tx.balanceAfter !== undefined ? formatCurrency(tx.balanceAfter) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Email Statement */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Email Account Statement"
        description="Receive an official digital copy of your statement directly in your inbox."
      >
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            label="Recipient Email Address"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            icon={Mail}
            helperText="The statement will be dispatched via CoinCraft Secure SMTP"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEmailModalOpen(false)}
              disabled={isEmailing}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isEmailing}>
              Send Statement Email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StatementsPage;
