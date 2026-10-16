import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Send,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { fetchAccounts } from '../../features/accounts/accountSlice';
import { fetchBeneficiaries } from '../../features/beneficiaries/beneficiarySlice';
import { executeTransfer, resetTransferState } from '../../features/transfers/transferSlice';
import { addToast } from '../../features/ui/uiSlice';
import { formatCurrency, maskAccountNumber, formatDateTime } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export const TransferPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const { accounts } = useSelector((state) => state.accounts);
  const { beneficiaries } = useSelector((state) => state.beneficiaries);
  const { isExecuting, error, success, lastTransfer } = useSelector((state) => state.transfers);

  const [senderAccountId, setSenderAccountId] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchBeneficiaries());
    dispatch(resetTransferState());
  }, [dispatch]);

  // Default to first active account
  useEffect(() => {
    if (!senderAccountId && accounts && accounts.length > 0) {
      const active = accounts.find((a) => a.status === 'ACTIVE' && a.isPrimary) || accounts.find((a) => a.status === 'ACTIVE') || accounts[0];
      if (active) setSenderAccountId(active.id || active._id);
    }
  }, [accounts, senderAccountId]);

  const selectedSenderAccount = accounts.find((a) => (a.id || a._id) === senderAccountId);
  const selectedBeneficiary = beneficiaries.find((b) => (b.id || b._id) === beneficiaryId);

  const validateForm = () => {
    const errors = {};
    if (!senderAccountId) {
      errors.senderAccountId = 'Please select a debit account';
    } else if (selectedSenderAccount?.status !== 'ACTIVE') {
      errors.senderAccountId = 'Selected account is not active';
    }

    if (!beneficiaryId) {
      errors.beneficiaryId = 'Please select a beneficiary';
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Please enter a valid transfer amount';
    } else if (numAmount > 50000) {
      errors.amount = 'Maximum allowed transfer per transaction is ₹50,000 (IMPS limit)';
    } else if (selectedSenderAccount && numAmount > Number(selectedSenderAccount.balance)) {
      errors.amount = `Insufficient balance. Available: ${formatCurrency(selectedSenderAccount.balance)}`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setTransactionPin('');
    setIsConfirmModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(transactionPin)) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Invalid PIN',
          message: 'Transaction PIN must be exactly 4 numeric digits.',
        })
      );
      return;
    }

    const result = await dispatch(
      executeTransfer({
        senderAccountId,
        beneficiaryId,
        amount: Number(amount),
        transactionPin,
        description: description.trim() || undefined,
      })
    );

    if (executeTransfer.fulfilled.match(result)) {
      setIsConfirmModalOpen(false);
      dispatch(
        addToast({
          type: 'success',
          title: 'Transfer Completed',
          message: `₹${Number(amount).toLocaleString('en-IN')} sent to ${selectedBeneficiary?.name || 'Beneficiary'}.`,
        })
      );
    }
  };

  const handleStartNewTransfer = () => {
    dispatch(resetTransferState());
    setAmount('');
    setDescription('');
    setTransactionPin('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
          Instant Fund Transfer
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Transfer money seamlessly to registered beneficiaries via 24x7 IMPS.
        </p>
      </div>

      {/* Warning if PIN is not set */}
      {user && !user.isTransactionPinSet && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Transaction PIN Required</p>
            <p className="mt-0.5 text-amber-800">
              You must set a 4-digit Transaction PIN before executing transfers.
            </p>
            <Link
              to="/profile?tab=security"
              className="inline-block mt-2 font-bold text-brand-blue hover:underline"
            >
              Set Transaction PIN Now →
            </Link>
          </div>
        </div>
      )}

      {/* Success Receipt View */}
      {success && lastTransfer ? (
        <Card className="border-green-200 bg-white">
          <div className="p-8 text-center border-b border-brand-border">
            <div className="w-16 h-16 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto mb-4 border border-green-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-brand-dark">Transfer Successful!</h3>
            <p className="text-xs text-brand-muted mt-1">
              Your funds have been credited to the recipient's account.
            </p>

            <div className="text-3xl font-extrabold text-brand-dark mt-4">
              {formatCurrency(lastTransfer.amount)}
            </div>

            <div className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-green-50 text-brand-success font-semibold border border-green-200">
              Reference: {lastTransfer.referenceNumber || lastTransfer.id}
            </div>
          </div>

          <div className="p-6 bg-brand-bg/40 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Debited From:</span>
              <span className="font-semibold text-brand-dark font-mono">
                {maskAccountNumber(selectedSenderAccount?.accountNumber)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Beneficiary Name:</span>
              <span className="font-semibold text-brand-dark">
                {selectedBeneficiary?.name || 'Registered Beneficiary'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Beneficiary Account:</span>
              <span className="font-semibold text-brand-dark font-mono">
                {maskAccountNumber(selectedBeneficiary?.accountNumber)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Payment Mode:</span>
              <span className="font-semibold text-brand-dark">IMPS (Instant)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Date & Time:</span>
              <span className="font-semibold text-brand-dark">
                {formatDateTime(lastTransfer.createdAt || new Date())}
              </span>
            </div>
            {lastTransfer.description && (
              <div className="flex justify-between py-1.5">
                <span className="text-brand-muted">Remarks:</span>
                <span className="font-semibold text-brand-dark">{lastTransfer.description}</span>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => navigate('/transactions')}
            >
              View In Statement
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleStartNewTransfer}
              icon={RotateCcw}
            >
              Make Another Transfer
            </Button>
          </div>
        </Card>
      ) : (
        /* Transfer Input Form */
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Transfer Details</CardTitle>
              <CardDescription>Enter recipient details and amount to proceed</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-blue font-semibold">
              <ShieldCheck className="w-4 h-4" /> 100% Secure Transfer
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-brand-accent/20 text-xs text-brand-accent flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleReview} className="space-y-5">
              {/* Sender Account Selector */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                  Debit Account <span className="text-brand-accent">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map((acc) => {
                    const accId = acc.id || acc._id;
                    const isSelected = senderAccountId === accId;
                    const isFrozen = acc.status === 'FROZEN';

                    return (
                      <div
                        key={accId}
                        onClick={() => !isFrozen && setSenderAccountId(accId)}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isFrozen
                            ? 'opacity-50 cursor-not-allowed bg-slate-100'
                            : 'cursor-pointer hover:border-brand-blue/50'
                        } ${
                          isSelected
                            ? 'border-brand-blue bg-brand-light ring-1 ring-brand-blue'
                            : 'border-brand-border bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                          <span>{acc.accountType}</span>
                          <span className="text-[10px] text-brand-muted font-normal">
                            {acc.status}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-brand-muted mt-1">
                          {maskAccountNumber(acc.accountNumber)}
                        </div>
                        <div className="text-xs font-bold text-brand-blue mt-1">
                          {formatCurrency(acc.balance)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {validationErrors.senderAccountId && (
                  <p className="mt-1 text-xs text-brand-accent">
                    {validationErrors.senderAccountId}
                  </p>
                )}
              </div>

              {/* Beneficiary Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-text uppercase tracking-wide">
                    Select Beneficiary <span className="text-brand-accent">*</span>
                  </label>
                  <Link
                    to="/beneficiaries?new=true"
                    className="text-xs font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add New
                  </Link>
                </div>

                {beneficiaries.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-brand-border bg-brand-bg/50 text-center">
                    <p className="text-xs text-brand-muted mb-2">No registered beneficiaries found.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/beneficiaries?new=true')}
                      icon={PlusCircle}
                      className="text-xs"
                    >
                      Register First Beneficiary
                    </Button>
                  </div>
                ) : (
                  <select
                    value={beneficiaryId}
                    onChange={(e) => setBeneficiaryId(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  >
                    <option value="">-- Choose Beneficiary --</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name} — {maskAccountNumber(b.accountNumber)} ({b.ifscCode})
                      </option>
                    ))}
                  </select>
                )}
                {validationErrors.beneficiaryId && (
                  <p className="mt-1 text-xs text-brand-accent">
                    {validationErrors.beneficiaryId}
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <Input
                label="Transfer Amount (₹)"
                type="number"
                min="1"
                max="50000"
                step="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={validationErrors.amount}
                helperText="Maximum ₹50,000 per IMPS transaction"
                required
              />

              {/* Description */}
              <Input
                label="Remarks / Purpose (Optional)"
                placeholder="e.g. Rent, consulting fee, loan repayment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!user?.isTransactionPinSet}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Review & Authorize Transfer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Confirmation & Transaction PIN Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Authorize Fund Transfer"
        description="Review transaction summary and enter your 4-digit security PIN"
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div className="p-4 rounded-xl bg-brand-light/70 border border-brand-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-muted">Amount to Send:</span>
              <span className="font-extrabold text-base text-brand-blue">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Beneficiary:</span>
              <span className="font-bold text-brand-dark">{selectedBeneficiary?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Account Number:</span>
              <span className="font-mono text-brand-dark">
                {maskAccountNumber(selectedBeneficiary?.accountNumber)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">IFSC Code:</span>
              <span className="font-mono text-brand-dark">{selectedBeneficiary?.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Transfer Fee:</span>
              <span className="font-bold text-brand-success">₹0.00 (Free IMPS)</span>
            </div>
          </div>

          <div>
            <Input
              label="4-Digit Transaction PIN"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={transactionPin}
              onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              icon={Lock}
              helperText="Enter your secret 4-digit transaction authorization PIN"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isExecuting}
              disabled={transactionPin.length !== 4}
            >
              Confirm & Execute
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransferPage;
