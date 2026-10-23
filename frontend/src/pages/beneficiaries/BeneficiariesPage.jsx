import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  PlusCircle,
  Search,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchBeneficiaries,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  activateBeneficiary,
  deactivateBeneficiary,
} from '../../features/beneficiaries/beneficiarySlice';
import { addToast } from '../../features/ui/uiSlice';
import { maskAccountNumber } from '../../utils/formatters';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const BeneficiariesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { beneficiaries, isLoading, isMutating } = useSelector(
    (state) => state.beneficiaries
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('new') === 'true');
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [deleteConfirmBeneficiary, setDeleteConfirmBeneficiary] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    ifscCode: 'SECB0000001',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchBeneficiaries());
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Beneficiary name must be at least 2 characters';
    }
    if (!formData.accountNumber.trim() || formData.accountNumber.trim().length < 6) {
      errors.accountNumber = 'Account number must be at least 6 characters';
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifscCode.trim().toUpperCase())) {
      errors.ifscCode = 'Must be valid 11-char IFSC code (e.g. SECB0000001 or HDFC0001234)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setFormData({ name: '', accountNumber: '', ifscCode: 'SECB0000001' });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setFormData({
      name: beneficiary.name,
      accountNumber: beneficiary.accountNumber,
      ifscCode: beneficiary.ifscCode,
    });
    setFormErrors({});
  };

  const handleSaveBeneficiary = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingBeneficiary) {
      const result = await dispatch(
        updateBeneficiary({
          id: editingBeneficiary.id || editingBeneficiary._id,
          name: formData.name,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
        })
      );
      if (updateBeneficiary.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Beneficiary Updated',
            message: `${formData.name} was updated successfully.`,
          })
        );
        setEditingBeneficiary(null);
      }
    } else {
      const result = await dispatch(
        addBeneficiary({
          name: formData.name,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
        })
      );
      if (addBeneficiary.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: 'success',
            title: 'Beneficiary Added',
            message: `${formData.name} is registered for instant transfers.`,
          })
        );
        setIsAddModalOpen(false);
        searchParams.delete('new');
        setSearchParams(searchParams);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmBeneficiary) return;
    const id = deleteConfirmBeneficiary.id || deleteConfirmBeneficiary._id;
    const result = await dispatch(deleteBeneficiary(id));
    setDeleteConfirmBeneficiary(null);

    if (deleteBeneficiary.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'info',
          title: 'Beneficiary Removed',
          message: 'The beneficiary was removed from your list.',
        })
      );
    }
  };

  const handleToggleStatus = async (beneficiary) => {
    const id = beneficiary.id || beneficiary._id;
    const action = beneficiary.isActive ? deactivateBeneficiary : activateBeneficiary;
    const result = await dispatch(action(id));

    if (action.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: 'info',
          title: beneficiary.isActive ? 'Beneficiary Deactivated' : 'Beneficiary Activated',
          message: `${beneficiary.name} is now ${beneficiary.isActive ? 'Inactive' : 'Active'}.`,
        })
      );
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(query) ||
      b.accountNumber?.toLowerCase().includes(query) ||
      b.ifscCode?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">
            Registered Beneficiaries
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage your verified recipients for fast, automated fund transfers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          icon={PlusCircle}
        >
          Add New Beneficiary
        </Button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-brand-border shadow-sm max-w-md">
        <Search className="w-4 h-4 text-brand-muted ml-1" />
        <input
          type="text"
          placeholder="Search by name, account number, or IFSC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-brand-dark bg-transparent focus:outline-none placeholder-brand-muted"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-brand-muted hover:text-brand-dark mr-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Beneficiaries Grid / Table */}
      {isLoading && beneficiaries.length === 0 ? (
        <LoadingSpinner message="Loading your beneficiary list..." />
      ) : filteredBeneficiaries.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No matching beneficiaries' : 'No beneficiaries registered'}
          description={
            searchQuery
              ? 'Try adjusting your search query.'
              : 'Add your first recipient using their bank account number and IFSC code.'
          }
          actionLabel={searchQuery ? 'Reset Search' : 'Add Beneficiary'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenAddModal}
          className="py-12"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBeneficiaries.map((b) => {
            const bId = b.id || b._id;
            return (
              <Card key={bId} hover className="flex flex-col justify-between">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-brand-light text-brand-blue font-bold flex items-center justify-center text-sm shadow-sm">
                        {b.name?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-dark">{b.name}</h4>
                        <span className="text-[10px] text-brand-muted flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {b.bankName || 'CoinCraft / Partner Bank'}
                        </span>
                      </div>
                    </div>

                    <Badge variant={b.isActive !== false ? 'success' : 'warning'} size="xs">
                      {b.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-4 p-3 rounded-xl bg-brand-bg border border-brand-border text-xs">
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Account No:</span>
                      <span className="font-mono font-semibold text-brand-dark">
                        {maskAccountNumber(b.accountNumber)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-muted">IFSC Code:</span>
                      <span className="font-mono font-semibold text-brand-dark">{b.ifscCode}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 bg-brand-bg/60 border-t border-brand-border flex items-center justify-between text-xs">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/transfer`)}
                    icon={Send}
                    className="text-xs py-1.5"
                  >
                    Send Money
                  </Button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(b)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-white transition-colors"
                      title="Edit Beneficiary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-amber-600 hover:bg-white transition-colors"
                      title={b.isActive !== false ? 'Deactivate' : 'Activate'}
                    >
                      {b.isActive !== false ? (
                        <XCircle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-brand-success" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmBeneficiary(b)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-accent hover:bg-white transition-colors"
                      title="Delete Beneficiary"
                    >
                      <Trash2 className="w-4 h-4 text-brand-accent" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Beneficiary */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingBeneficiary)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBeneficiary(null);
        }}
        title={editingBeneficiary ? 'Edit Beneficiary Details' : 'Add New Beneficiary'}
        description="Enter the recipient's bank details accurately for instant IMPS transfers."
      >
        <form onSubmit={handleSaveBeneficiary} className="space-y-4">
          <Input
            label="Beneficiary Full Name"
            placeholder="e.g. Ramesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
          />

          <Input
            label="Account Number"
            placeholder="e.g. 123456789012"
            value={formData.accountNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
            error={formErrors.accountNumber}
            required
          />

          <Input
            label="IFSC Code (11 Characters)"
            placeholder="e.g. SECB0000001 or HDFC0001234"
            value={formData.ifscCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))
            }
            error={formErrors.ifscCode}
            helperText="Indian Financial System Code (e.g. SECB0000001)"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingBeneficiary(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isMutating}>
              {editingBeneficiary ? 'Save Changes' : 'Register Beneficiary'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={Boolean(deleteConfirmBeneficiary)}
        onClose={() => setDeleteConfirmBeneficiary(null)}
        title="Remove Beneficiary"
      >
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-brand-accent flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-brand-dark">
              Delete {deleteConfirmBeneficiary?.name}?
            </h4>
            <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
              This beneficiary will be permanently removed. You will need to re-enter their details if you wish to transfer funds in the future.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setDeleteConfirmBeneficiary(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} isLoading={isMutating}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BeneficiariesPage;
