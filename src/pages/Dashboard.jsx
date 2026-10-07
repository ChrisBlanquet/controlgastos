import { useEffect, useMemo, useRef, useState } from "react";
import AddCardModal from "../components/cards/AddCardModal";
import CardDetailView from "../components/cards/CardDetailView";
import AddExpenseModal from "../components/expenses/AddExpenseModal";
import AdvanceModal from "../components/expenses/AdvanceModal";
import FilterBottomSheet from "../components/expenses/FilterBottomSheet";
import MovementActionSheet from "../components/expenses/MovementActionSheet";
import AppLayout from "../components/layout/AppLayout";
import Toast from "../components/ui/Toast";
import MetricsView from "../components/metrics/MetricsView";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useExpenses } from "../hooks/useExpenses";
import { useIncomes } from "../hooks/useIncomes";
import { useLoans } from "../hooks/useLoans";
import { usePayments } from "../hooks/usePayments";
import { currentMonthValue, matchesMonth } from "../utils/expenses";
import { countActiveFilters, DEFAULT_HOME_FILTERS, matchesHomeFilters } from "../utils/filters";
import { setAccountBalance } from "../services/accountService";
import { calculateCardBalances, resolveAccountBalance } from "../utils/cardStatement";
import { availableCredit } from "../utils/money";
import { toSafeNumber } from "../utils/numbers";
import { dueInMonth } from "../utils/projections";
import CardsView from "./CardsView";
import HomeView from "./HomeView";
import IncomeView from "./IncomeView";
import LoansView from "./LoansView";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, loading: accountsLoading, error: accountsError, addAccount, editAccount, removeAccount } =
    useAccounts(user);
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    addExpense,
    editExpense,
    removeExpense,
    advanceExpense,
    toggleStatus,
  } = useExpenses(user);
  const { categories, addCategory } = useCategories(user);
  const { incomes, saveIncome, incomeFor } = useIncomes(user);
  const { loans, loading: loansLoading, error: loansError, totalBalance, addLoan, editLoan, removeLoan, payInstallment } =
    useLoans(user);
  const { payments, addPayment, removePayment } = usePayments(user);
  const [savingPayment, setSavingPayment] = useState(false);

  const [tab, setTab] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [savingCard, setSavingCard] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [advancing, setAdvancing] = useState(null);
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [homeMonth, setHomeMonth] = useState(currentMonthValue());
  const [homeFilters, setHomeFilters] = useState(DEFAULT_HOME_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionExpense, setActionExpense] = useState(null);
  const [actionAmount, setActionAmount] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const [toast, setToast] = useState("");
  const syncedBalances = useRef(new Set());

  const displayAccounts = useMemo(
    () =>
      accounts.map((account) => ({
        ...account,
        currentBalance: resolveAccountBalance(account, expenses, payments),
      })),
    [accounts, expenses, payments]
  );

  const metrics = useMemo(() => {
    const cards = displayAccounts.filter((account) => account.type === "credit_card");
    const source = cards.length ? cards : displayAccounts;
    const totalDebt = source.reduce((sum, account) => sum + (Number(account.currentBalance) || 0), 0);
    const totalLimit = source.reduce((sum, account) => sum + (Number(account.creditLimit) || 0), 0);
    return {
      totalDebt,
      totalAvailable: availableCredit(totalDebt, totalLimit),
      totalLimit,
      count: displayAccounts.length,
    };
  }, [displayAccounts]);

  const detailAccount = displayAccounts.find((account) => account.id === detailId) ?? null;

  useEffect(() => {
    if (detailId && !accounts.some((account) => account.id === detailId)) {
      setDetailId(null);
    }
  }, [accounts, detailId]);

  useEffect(() => {
    if (accountsLoading || expensesLoading) return;

    accounts.forEach((account) => {
      if (account.type === "loan") return;
      const hasExpenses = expenses.some((expense) => expense.accountId === account.id);
      if (!hasExpenses) return;

      const computed = resolveAccountBalance(account, expenses, payments);
      const stored = toSafeNumber(account.currentBalance, 0);
      if (Math.abs(computed - stored) < 0.02) return;

      const key = `${account.id}:${computed.toFixed(2)}`;
      if (syncedBalances.current.has(key)) return;
      syncedBalances.current.add(key);
      setAccountBalance(account.id, computed).catch(() => {
        syncedBalances.current.delete(key);
      });
    });
  }, [accounts, expenses, payments, accountsLoading, expensesLoading]);

  const activeFilterCount = countActiveFilters(homeFilters);
  const monthIncome = incomeFor(homeMonth);
  const monthDue = useMemo(() => dueInMonth(expenses, homeMonth, loans), [expenses, homeMonth, loans]);
  const homeFeed = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          matchesMonth(expense.purchaseDate, homeMonth) &&
          matchesHomeFilters(expense, homeFilters, categories)
      ),
    [expenses, homeMonth, homeFilters, categories]
  );

  function navigate(nextTab) {
    setTab(nextTab);
    setDetailId(null);
  }

  function openCreateCard() {
    setEditingCard(null);
    setCardModalOpen(true);
  }

  function openEditCard(account) {
    setEditingCard(account);
    setCardModalOpen(true);
  }

  function openCreateExpense() {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  }

  async function handleCardSubmit(payload) {
    setSavingCard(true);
    try {
      if (editingCard) await editAccount(editingCard.id, payload);
      else await addAccount(payload);
      setCardModalOpen(false);
      setEditingCard(null);
    } finally {
      setSavingCard(false);
    }
  }

  async function handleCardDelete(id) {
    const confirmed = window.confirm("¿Eliminar esta cuenta? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    await removeAccount(id);
    setCardModalOpen(false);
    setEditingCard(null);
    if (detailId === id) setDetailId(null);
  }

  async function handleExpenseSubmit(payload) {
    setSavingExpense(true);
    try {
      if (editingExpense) await editExpense(editingExpense.id, payload, editingExpense);
      else await addExpense(payload);
      setExpenseModalOpen(false);
      setEditingExpense(null);
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleExpenseDelete(expense) {
    setDeletingExpense(true);
    try {
      await removeExpense(expense);
      setToast("Movimiento eliminado");
    } finally {
      setDeletingExpense(false);
    }
  }

  function openMovementActions(expense, amount) {
    if (!expense) return;
    setActionExpense(expense);
    setActionAmount(amount ?? expense.totalAmount);
  }

  async function handleAdvance(expense, count) {
    setSavingAdvance(true);
    try {
      const card = accounts.find((account) => account.id === expense.accountId);
      const cycleMonth = card ? calculateCardBalances(card, expenses).cycleMonth : null;
      await advanceExpense(expense, count, cycleMonth);
      setAdvancing(null);
    } finally {
      setSavingAdvance(false);
    }
  }

  async function handleAddPayment(payload) {
    setSavingPayment(true);
    try {
      await addPayment(payload);
    } finally {
      setSavingPayment(false);
    }
  }

  const expenseActions = {
    onOpenActions: openMovementActions,
    onAdvance: setAdvancing,
    onToggleStatus: toggleStatus,
  };

  let content = null;

  if (detailAccount) {
    content = (
      <CardDetailView
        account={detailAccount}
        expenses={expenses}
        payments={payments}
        accounts={displayAccounts}
        categories={categories}
        loading={expensesLoading}
        savingPayment={savingPayment}
        onBack={() => setDetailId(null)}
        onEditCard={() => openEditCard(detailAccount)}
        onAddExpense={openCreateExpense}
        onAddPayment={handleAddPayment}
        onDeletePayment={removePayment}
        onAdvance={expenseActions.onAdvance}
        onToggleStatus={expenseActions.onToggleStatus}
        onOpenActions={openMovementActions}
        overlayOpen={expenseModalOpen || cardModalOpen || Boolean(advancing) || Boolean(actionExpense)}
      />
    );
  } else if (tab === "cards") {
    content = (
      <CardsView
        accounts={displayAccounts}
        loading={accountsLoading}
        error={accountsError}
        onAdd={openCreateCard}
        onSelect={setDetailId}
      />
    );
  } else if (tab === "loans") {
    content = (
      <LoansView
        loans={loans}
        loading={loansLoading}
        error={loansError}
        totalBalance={totalBalance}
        onAdd={addLoan}
        onEdit={editLoan}
        onDelete={removeLoan}
        onPay={payInstallment}
      />
    );
  } else if (tab === "income") {
    content = (
      <IncomeView
        month={homeMonth}
        onMonthChange={setHomeMonth}
        income={monthIncome}
        incomes={incomes}
        due={monthDue}
        onSave={saveIncome}
      />
    );
  } else if (tab === "metrics") {
    content = (
      <MetricsView
        month={homeMonth}
        onMonthChange={setHomeMonth}
        expenses={expenses}
        accounts={displayAccounts}
        categories={categories}
        income={monthIncome}
        onSaveIncome={saveIncome}
        loans={loans}
      />
    );
  } else {
    content = (
      <HomeView
        month={homeMonth}
        onMonthChange={setHomeMonth}
        metrics={metrics}
        income={monthIncome}
        due={monthDue}
        onSaveIncome={saveIncome}
        accounts={displayAccounts}
        accountsLoading={accountsLoading}
        accountsError={accountsError}
        onAddCard={openCreateCard}
        onSelectCard={setDetailId}
        categories={categories}
        filters={homeFilters}
        onFiltersChange={setHomeFilters}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
        expenses={homeFeed}
        expensesLoading={expensesLoading}
        expensesError={expensesError}
        expenseActions={expenseActions}
        onResetFilters={() => setHomeFilters(DEFAULT_HOME_FILTERS)}
        onAddExpense={openCreateExpense}
      />
    );
  }

  return (
    <>
      <AppLayout
        activeTab={tab}
        onNavigate={navigate}
        user={user}
        onLogout={logout}
        onAddExpense={openCreateExpense}
        showFab={!detailAccount && !actionExpense && !expenseModalOpen && !filtersOpen && !advancing}
      >
        {content}
      </AppLayout>

      <AddCardModal
        open={cardModalOpen}
        account={editingCard}
        saving={savingCard}
        onClose={() => setCardModalOpen(false)}
        onSubmit={handleCardSubmit}
        onDelete={handleCardDelete}
      />
      <AddExpenseModal
        open={expenseModalOpen}
        accounts={displayAccounts}
        expenses={expenses}
        expense={editingExpense}
        saving={savingExpense}
        defaultAccountId={detailId}
        lockAccount={Boolean(detailAccount)}
        categories={categories}
        onCreateCategory={addCategory}
        onClose={() => setExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />
      <AdvanceModal
        open={Boolean(advancing)}
        expense={advancing}
        saving={savingAdvance}
        onClose={() => setAdvancing(null)}
        onConfirm={handleAdvance}
      />
      <FilterBottomSheet
        open={filtersOpen}
        accounts={displayAccounts}
        categories={categories}
        filters={homeFilters}
        onApply={(next) => {
          setHomeFilters(next);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
      <MovementActionSheet
        open={Boolean(actionExpense)}
        expense={actionExpense}
        amount={actionAmount}
        saving={deletingExpense}
        onClose={() => {
          setActionExpense(null);
          setActionAmount(null);
        }}
        onEdit={(item) => {
          setEditingExpense(item);
          setExpenseModalOpen(true);
        }}
        onDelete={handleExpenseDelete}
      />
      {toast ? <Toast message={toast} onDone={() => setToast("")} /> : null}
    </>
  );
}
