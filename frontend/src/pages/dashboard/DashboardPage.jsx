import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Eye,
  EyeOff,
  Send,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Wallet,
  Clock,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Moon,
} from 'lucide-react';
import { formatCurrency, maskAccountNumber, formatDateTime, formatDateOnly } from '../../utils/formatters';
import { toggleBalanceVisibility } from '../../features/ui/uiSlice';
import { fetchAccounts, setSelectedAccount } from '../../features/accounts/accountSlice';
import api from '../../services/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const isBalanceVisible = useSelector((state) => state.ui.isBalanceVisible);
  const { accounts, selectedAccount, isLoading: accountsLoading } = useSelector(
    (state) => state.accounts
  );

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.dashboard || res.data);
      }
    } catch {
      // Fallback handled smoothly
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    dispatch(fetchAccounts());
  }, [dispatch]);

  const activeAccount =
    selectedAccount ||
    (accounts && accounts.length > 0 ? accounts[0] : null) ||
    dashboardData?.accounts?.[0] ||
    null;

  const totalBalance =
    dashboardData?.summary?.totalBalance !== undefined
      ? dashboardData.summary.totalBalance
      : dashboardData?.totalBalance !== undefined
      ? dashboardData.totalBalance
      : accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

  const recentTransactions =
    dashboardData?.recentTransactions || [];

  const getGreetingData = () => {
    const hour = new Date().getHours();
    // 05:00 - 11:59 -> Morning
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good Morning',
        icon: Sunrise,
        iconColor: 'text-amber-400',
        bgGlow: 'bg-amber-400/10 border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.25)]',
      };
    }
    // 12:00 - 16:59 -> Afternoon
    if (hour >= 12 && hour < 17) {
      return {
        text: 'Good Afternoon',
        icon: Sun,
        iconColor: 'text-orange-400',
        bgGlow: 'bg-orange-400/10 border-orange-400/20 shadow-[0_0_15px_rgba(251,146,60,0.25)]',
      };
    }
    // 17:00 - 21:59 -> Evening
    if (hour >= 17 && hour < 22) {
      return {
        text: 'Good Evening',
        icon: Sunset,
        iconColor: 'text-rose-400',
        bgGlow: 'bg-rose-400/10 border-rose-400/20 shadow-[0_0_15px_rgba(251,113,133,0.25)]',
      };
    }
    // 22:00 - 04:59 -> Night
    return {
      text: 'Good Night',
      icon: Moon,
      iconColor: 'text-indigo-300',
      bgGlow: 'bg-indigo-400/10 border-indigo-400/20 shadow-[0_0_15px_rgba(129,140,248,0.25)]',
    };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;

  if (accountsLoading && !dashboardData) {
    return <LoadingSpinner message="Loading your banking dashboard..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* 360 Degree Continuously Rotating Animated Logo Badge */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${greeting.bgGlow}`}
            title={`${greeting.text} - SecureBank`}
          >
            <GreetingIcon
              className={`w-6 h-6 sm:w-6.5 sm:h-6.5 ${greeting.iconColor} animate-spin-360`}
            />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F7FAFF] tracking-tight">
              {greeting.text},{' '}
              <span className="text-[#D62839] drop-shadow-sm">{user?.firstName || 'Valued Customer'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Welcome to your SecureBank digital portal. Here is your financial snapshot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            icon={RefreshCw}
            className="text-xs"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/transfer')}
            icon={Send}
            className="text-xs"
          >
            Transfer Money
          </Button>
        </div>
      </div>

      {/* Featured Balance Card & Quick Account Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Prominent Balance Card */}
        <div className="lg:col-span-2 relative rounded-2xl bg-gradient-to-br from-[#0B1F3A] via-[#0D274D] to-[#12325E] text-white p-6 sm:p-8 shadow-panel overflow-hidden border border-[#1E4578]">
          {/* Subtle background circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#D62839]/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-[#004B8E]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#D62839]/20 border border-[#D62839]/40">
                    <ShieldCheck className="w-4 h-4 text-[#D62839]" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    SecureBank Premium NetBanking
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(toggleBalanceVisibility())}
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                  title={isBalanceVisible ? 'Hide Balance' : 'Show Balance'}
                >
                  {isBalanceVisible ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> <span>Show</span>
                    </>
                  )}
                </button>
              </div>

              {/* Total Balance Amount */}
              <div className="mt-6">
                <span className="text-xs text-[#94B4DB] block uppercase tracking-wider font-medium">
                  Total Consolidated Balance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#F7FAFF] mt-1 tracking-tight">
                  {isBalanceVisible ? formatCurrency(totalBalance) : '₹ ••••••••'}
                </div>
              </div>

              {/* Active Account Sub-Card */}
              {activeAccount && (
                <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-[#94B4DB] block">Primary Account</span>
                    <span className="text-sm font-semibold text-white tracking-wide font-mono">
                      {maskAccountNumber(activeAccount.accountNumber)}
                    </span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#D62839]/20 border border-[#D62839]/40 text-[#F7FAFF] font-medium">
                      {activeAccount.accountType || 'SAVINGS'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#94B4DB] block">Account Balance</span>
                    <span className="text-sm font-bold text-white">
                      {isBalanceVisible ? formatCurrency(activeAccount.balance) : '₹ ••••••'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Shortcuts inside card */}
            <div className="mt-8 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate('/transfer')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#D62839] hover:bg-[#BA1E2E] text-white text-xs font-semibold shadow-glow-red transition-all"
              >
                <Send className="w-3.5 h-3.5" /> <span>Send</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#12325E] hover:bg-[#1A437C] text-white text-xs font-semibold border border-[#1E4578] transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" /> <span>Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/statements')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#12325E] hover:bg-[#1A437C] text-white text-xs font-semibold border border-[#1E4578] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> <span>Statement</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/beneficiaries')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#12325E] hover:bg-[#1A437C] text-white text-xs font-semibold border border-[#1E4578] transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> <span>Beneficiary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Account Selector / Summary Card */}
        <div className="bg-[#0D274D] rounded-2xl border border-[#1E4578] p-5 shadow-card flex flex-col justify-between text-[#F7FAFF]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E4578] mb-4">
              <h3 className="text-sm font-bold text-[#F7FAFF]">My Accounts ({accounts.length})</h3>
              <Link
                to="/accounts"
                className="text-xs font-bold text-[#D62839] hover:underline inline-flex items-center"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {accounts.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No accounts linked"
                description="Open your first savings or checking account with instant approval."
                actionLabel="Open Account"
                onAction={() => navigate('/accounts')}
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const isSelected =
                    (acc.id || acc._id) === (activeAccount?.id || activeAccount?._id);
                  return (
                    <div
                      key={acc.id || acc._id}
                      onClick={() => dispatch(setSelectedAccount(acc))}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-blue bg-[#12325E] shadow-sm'
                          : 'border-brand-border hover:border-brand-blue/50 hover:bg-[#12325E]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard
                            className={`w-4 h-4 ${isSelected ? 'text-brand-blue' : 'text-brand-muted'}`}
                          />
                          <span className="text-xs font-bold text-brand-text">
                            {acc.accountType}
                          </span>
                          {acc.isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-blue text-white font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}
                          size="xs"
                        >
                          {acc.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border/60">
                        <span className="text-xs text-brand-muted font-mono">
                          {maskAccountNumber(acc.accountNumber)}
                        </span>
                        <span className="text-xs font-bold text-brand-text">
                          {isBalanceVisible ? formatCurrency(acc.balance) : '₹ ••••••'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-brand-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/accounts?new=true')}
              icon={PlusCircle}
            >
              Open Another Account
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Security Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Account Activity</CardTitle>
                <CardDescription>Latest financial transactions and fund transfers</CardDescription>
              </div>
              <Link
                to="/transactions"
                className="text-xs font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
              >
                View Full Statement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="Your recent deposits, withdrawals, and transfers will appear here."
                  className="m-6"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-bg/60 text-[11px] uppercase tracking-wider text-brand-muted border-b border-brand-border">
                        <th className="py-3 px-5 font-semibold">Date & Time</th>
                        <th className="py-3 px-5 font-semibold">Description</th>
                        <th className="py-3 px-5 font-semibold">Type</th>
                        <th className="py-3 px-5 font-semibold text-right">Amount</th>
                        <th className="py-3 px-5 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-xs">
                      {recentTransactions.map((tx) => {
                        const isCredit =
                          tx.type === 'DEPOSIT' ||
                          tx.type === 'TRANSFER_IN' ||
                          tx.type === 'INTEREST';
                        return (
                          <tr
                            key={tx.id || tx._id || tx.transactionId}
                            className="hover:bg-brand-light/40 transition-colors"
                          >
                            <td className="py-3.5 px-5 text-brand-muted font-medium whitespace-nowrap">
                              {formatDateOnly(tx.createdAt)}
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-brand-dark max-w-xs truncate">
                              {tx.description || 'Banking Transaction'}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="text-[11px] text-brand-muted font-medium">
                                {tx.type?.replace('_', ' ')}
                              </span>
                            </td>
                            <td
                              className={`py-3.5 px-5 text-right font-bold whitespace-nowrap ${
                                isCredit ? 'text-brand-success' : 'text-brand-accent'
                              }`}
                            >
                              {isCredit ? '+' : '-'}{' '}
                              {formatCurrency(tx.amount)}
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security & Financial Tips Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & NetBanking Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-brand-dark">Never Share Your PIN</p>
                  <p className="text-brand-muted mt-0.5 leading-relaxed">
                    SecureBank representatives will never ask for your 4-digit transaction PIN, password, or OTP.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <Sparkles className="w-5 h-5 text-brand-success flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-brand-dark">Instant IMPS Transfers</p>
                  <p className="text-brand-muted mt-0.5 leading-relaxed">
                    Add beneficiaries once and send up to ₹50,000 per transfer with zero waiting time.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/profile?tab=security')}
                >
                  Configure Security PIN
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
