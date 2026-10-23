import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  CreditCard,
  PlusCircle,
  Snowflake,
  Sun,
  XCircle,
  Star,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchAccounts,
  createAccount,
  freezeAccount,
  unfreezeAccount,
  closeAccount,
  setPrimaryAccount,
} from '../../features/accounts/accountSlice';
import { depositMoney, withdrawMoney } from '../../features/transactions/transactionSlice';
import { addToast } from '../../features/ui/uiSlice';
import { formatCurrency, maskAccountNumber, formatDateTime } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { accounts, isLoading, isMutating } = useSelector((state) => state.accounts);
  const isBalanceVisible = useSelector((state) => state.ui.isBalanceVisible);

  // Modal States
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(searchParams.get('new') === 'true');
  const [newAccountType, setNewAccountType] = useState('SAVINGS');

  const [depositModalAccount, setDepositModalAccount] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  const [withdrawModalAccount, setWithdrawModalAccount] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');

  const [closeConfirmAccount, setCloseConfirmAccount] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleCopy = (accountNumber, id) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    dispatch(
      addToast({
        type: 'info',
        title: 'Copied to Clipboard',
        message: `Account Number ${accountNumber} copied.`,
        duration: 3000,
      })
    );
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const result = await dispatch(createAccount({ accountType: newAccountType }));
    if (createAccount.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Account Created',
          message: `Your new ${newAccountType} account has been created.`,
        })
      );
      setIsNewAccountOpen(false);
      searchParams.delete('new');
      setSearchParams(searchParams);
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Account Creation Failed',
          message: result.payload || 'Unable to open account',
        })
      );
    }
  };

  const handleFreezeToggle = async (account) => {
    const isFrozen = account.status === 'FROZEN';
    const action = isFrozen ? unfreezeAccount : freezeAccount;
    const result = await dispatch(action(account.id || account._id));

    if (action.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'info',
          title: isFrozen ? 'Account Unfrozen' : 'Account Frozen',
          message: `Account ${maskAccountNumber(account.accountNumber)} is now ${
            isFrozen ? 'ACTIVE' : 'FROZEN'
          }.`,
        })
      );
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Action Failed',
          message: result.payload,
        })
      );
    }
  };

  const handleSetPrimary = async (account) => {
    const result = await dispatch(setPrimaryAccount(account.id || account._id));
    if (setPrimaryAccount.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Primary Account Updated',
          message: `Account ${maskAccountNumber(account.accountNumber)} is now your primary account.`,
        })
      );
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Action Failed',
          message: result.payload || 'Failed to update primary account',
        })
      );
    }
  };

  const handleCloseAccount = async () => {
    if (!closeConfirmAccount) return;
    const result = await dispatch(closeAccount(closeConfirmAccount.id || closeConfirmAccount._id));
    setCloseConfirmAccount(null);

    if (closeAccount.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'warning',
          title: 'Account Closed',
          message: 'The selected account has been officially closed.',
        })
      );
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Unable to Close Account',
          message: result.payload,
        })
      );
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;

    const result = await dispatch(
      depositMoney({
        accountId: depositModalAccount.id || depositModalAccount._id,
        amount: depositAmount,
        description: depositDescription.trim() || 'Direct Account Deposit',
      })
    );

    if (depositMoney.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Deposit Successful',
          message: `Successfully credited ${formatCurrency(depositAmount)} to your account.`,
        })
      );
      setDepositModalAccount(null);
      setDepositAmount('');
      setDepositDescription('');
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Deposit Failed',
          message: result.payload,
        })
      );
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;

    const result = await dispatch(
      withdrawMoney({
        accountId: withdrawModalAccount.id || withdrawModalAccount._id,
        amount: withdrawAmount,
        description: withdrawDescription.trim() || 'ATM / Branch Withdrawal',
      })
    );

    if (withdrawMoney.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Withdrawal Successful',
          message: `Successfully debited ${formatCurrency(withdrawAmount)} from your account.`,
        })
      );
      setWithdrawModalAccount(null);
      setWithdrawAmount('');
      setWithdrawDescription('');
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Withdrawal Failed',
          message: result.payload,
        })
      );
    }
  };

  if (isLoading && accounts.length === 0) {
    return <LoadingSpinner message="Retrieving your accounts..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Simulated Accounts • Virtual Demo Balances
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
            Accounts Portfolio
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage your simulated savings and current accounts. All balances are virtual demo credits.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewAccountOpen(true)}
          icon={PlusCircle}
        >
          Open New Account
        </Button>
      </div>

      {/* Account Cards Grid */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No bank accounts opened yet"
          description="Open your first SecureBank savings account instantly with full NetBanking privileges."
          actionLabel="Create Savings Account"
          onAction={() => setIsNewAccountOpen(true)}
          className="py-12"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const accId = acc.id || acc._id;
            const isFrozen = acc.status === 'FROZEN';
            const isClosed = acc.status === 'CLOSED';

            return (
              <Card
                key={accId}
                className={`relative flex flex-col justify-between transition-all ${
                  acc.isPrimary ? 'ring-2 ring-brand-blue/30' : ''
                } ${isFrozen ? 'bg-slate-50 opacity-90' : 'bg-white'}`}
                hover
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-brand-light text-brand-blue">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-dark">{acc.accountType}</h4>
                        <span className="text-[10px] text-brand-muted">
                          Opened {formatDateTime(acc.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {acc.isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue text-white">
                          Primary
                        </span>
                      )}
                      <Badge
                        variant={
                          acc.status === 'ACTIVE'
                            ? 'success'
                            : isFrozen
                            ? 'warning'
                            : 'danger'
                        }
                        size="xs"
                      >
                        {acc.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Account Number with Copy */}
                  <div className="p-3 rounded-xl bg-brand-bg flex items-center justify-between border border-brand-border">
                    <div className="font-mono text-xs font-semibold text-brand-dark tracking-wider">
                      {maskAccountNumber(acc.accountNumber)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.accountNumber, accId)}
                      className="p-1 rounded text-brand-muted hover:text-brand-blue transition-colors"
                      title="Copy Full Account Number"
                    >
                      {copiedId === accId ? (
                        <Check className="w-4 h-4 text-brand-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-4">
                    <span className="text-[11px] text-brand-muted uppercase tracking-wider block">
                      Available Balance
                    </span>
                    <span className="text-2xl font-extrabold text-brand-dark mt-0.5 block tracking-tight">
                      {isBalanceVisible ? formatCurrency(acc.balance) : '₹ ••••••'}
                    </span>
                  </div>

                  {/* Quick Deposit / Withdraw Buttons */}
                  {!isClosed && !isFrozen && (
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-brand-border">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDepositModalAccount(acc)}
                        icon={ArrowDownLeft}
                        className="text-xs py-1.5"
                      >
                        Deposit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawModalAccount(acc)}
                        icon={ArrowUpRight}
                        className="text-xs py-1.5"
                      >
                        Withdraw
                      </Button>
                    </div>
                  )}
                </div>

                {/* Card Controls Footer */}
                <div className="px-5 py-3 bg-brand-bg/60 border-t border-brand-border flex items-center justify-between text-xs">
                  {!acc.isPrimary && !isClosed && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(acc)}
                      className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" /> Make Primary
                    </button>
                  )}
                  {acc.isPrimary && (
                    <span className="text-brand-muted text-[11px] font-medium flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-brand-blue" /> Default Account
                    </span>
                  )}

                  <div className="flex items-center gap-3 ml-auto">
                    {!isClosed && (
                      <button
                        type="button"
                        onClick={() => handleFreezeToggle(acc)}
                        className={`font-semibold inline-flex items-center gap-1 ${
                          isFrozen
                            ? 'text-brand-success hover:underline'
                            : 'text-amber-600 hover:underline'
                        }`}
                      >
                        {isFrozen ? (
                          <>
                            <Sun className="w-3.5 h-3.5" /> Unfreeze
                          </>
                        ) : (
                          <>
                            <Snowflake className="w-3.5 h-3.5" /> Freeze
                          </>
                        )}
                      </button>
                    )}

                    {!isClosed && !acc.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setCloseConfirmAccount(acc)}
                        className="text-brand-accent font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Close
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Open New Account */}
      <Modal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        title="Open a New Bank Account"
        description="Select the type of account you wish to create under your SecureBank profile."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wide">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['SAVINGS', 'CHECKING', 'SALARY', 'BUSINESS'].map((type) => (
                <div
                  key={type}
                  onClick={() => setNewAccountType(type)}
                  className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                    newAccountType === type
                      ? 'border-brand-blue bg-brand-light text-brand-blue font-bold shadow-sm'
                      : 'border-brand-border text-brand-text hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs block">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-brand-dark">
            <p className="font-semibold">Instant Digital Issuance</p>
            <p className="text-brand-muted mt-0.5">
              Your new account number will be generated immediately with ₹0 opening balance and full NetBanking access.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setIsNewAccountOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isMutating}>
              Confirm & Open Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Deposit Money */}
      <Modal
        isOpen={Boolean(depositModalAccount)}
        onClose={() => setDepositModalAccount(null)}
        title={`Deposit Funds — ${depositModalAccount?.accountType}`}
        description={`Credit funds to account ${maskAccountNumber(depositModalAccount?.accountNumber)}`}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 5000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
            helperText="Direct payroll, UPI, or cash deposit simulation"
          />

          <Input
            label="Description / Remarks"
            placeholder="e.g. Salary Credit or Savings Deposit"
            value={depositDescription}
            onChange={(e) => setDepositDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setDepositModalAccount(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" size="md" isLoading={isMutating}>
              Complete Deposit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Withdraw Money */}
      <Modal
        isOpen={Boolean(withdrawModalAccount)}
        onClose={() => setWithdrawModalAccount(null)}
        title={`Withdraw Funds — ${withdrawModalAccount?.accountType}`}
        description={`Debit funds from account ${maskAccountNumber(withdrawModalAccount?.accountNumber)} (Available: ${formatCurrency(withdrawModalAccount?.balance)})`}
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 1000"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
            helperText="Cash withdrawal or automated debit"
          />

          <Input
            label="Description / Remarks"
            placeholder="e.g. ATM Cash Withdrawal"
            value={withdrawDescription}
            onChange={(e) => setWithdrawDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setWithdrawModalAccount(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="md" isLoading={isMutating}>
              Confirm Withdrawal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Close Account Confirmation */}
      <Modal
        isOpen={Boolean(closeConfirmAccount)}
        onClose={() => setCloseConfirmAccount(null)}
        title="Confirm Account Closure"
      >
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-brand-accent flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-brand-dark">
              Are you sure you want to close this account?
            </h4>
            <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
              Account <strong>{maskAccountNumber(closeConfirmAccount?.accountNumber)}</strong> will be permanently deactivated. Any remaining balance must be transferred beforehand.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setCloseConfirmAccount(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleCloseAccount} isLoading={isMutating}>
              Permanently Close Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountsPage;
