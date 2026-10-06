import { useCallback, useEffect, useState } from "react";
import {
  advanceInstallments,
  createExpense,
  deleteExpense,
  subscribeExpenses,
  toggleExpenseStatus,
  updateExpense,
} from "../services/expenseService";

export function useExpenses(user) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    return subscribeExpenses(
      (items) => {
        setExpenses(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "No se pudieron cargar los gastos.");
        setLoading(false);
      }
    );
  }, [user]);

  const addExpense = useCallback(
    (payload) => createExpense(payload, user?.uid),
    [user]
  );

  return {
    expenses,
    loading,
    error,
    addExpense,
    editExpense: updateExpense,
    removeExpense: deleteExpense,
    advanceExpense: advanceInstallments,
    toggleStatus: toggleExpenseStatus,
  };
}
