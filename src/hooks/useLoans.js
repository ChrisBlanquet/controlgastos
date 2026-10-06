import { useCallback, useEffect, useMemo, useState } from "react";
import { createLoan, deleteLoan, payLoanInstallment, subscribeLoans, updateLoan } from "../services/loanService";
import { toSafeNumber } from "../utils/numbers";

export function useLoans(user) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoans([]);
      setLoading(false);
      return undefined;
    }

    return subscribeLoans(
      (items) => {
        setLoans(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "No se pudieron cargar los préstamos.");
        setLoading(false);
      }
    );
  }, [user]);

  const addLoan = useCallback((payload) => createLoan(payload, user?.uid), [user]);

  const totalBalance = useMemo(
    () => loans.reduce((sum, loan) => sum + toSafeNumber(loan.currentBalance, 0), 0),
    [loans]
  );

  return {
    loans,
    loading,
    error,
    totalBalance,
    addLoan,
    editLoan: updateLoan,
    removeLoan: deleteLoan,
    payInstallment: payLoanInstallment,
  };
}
