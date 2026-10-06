import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAccount,
  deleteAccount,
  subscribeAccounts,
  updateAccount,
} from "../services/accountService";
import { availableCredit } from "../utils/money";

export function useAccounts(user) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    return subscribeAccounts(
      (items) => {
        setAccounts(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "No se pudieron cargar las cuentas.");
        setLoading(false);
      }
    );
  }, [user]);

  const addAccount = useCallback(
    (payload) => createAccount(payload, user?.uid),
    [user]
  );

  const metrics = useMemo(() => {
    const cards = accounts.filter((account) => account.type === "credit_card");
    const source = cards.length ? cards : accounts;
    const totalDebt = source.reduce(
      (sum, account) => sum + (Number(account.currentBalance) || 0),
      0
    );
    const totalLimit = source.reduce(
      (sum, account) => sum + (Number(account.creditLimit) || 0),
      0
    );

    return {
      totalDebt,
      totalAvailable: availableCredit(totalDebt, totalLimit),
      totalLimit,
      count: accounts.length,
    };
  }, [accounts]);

  return {
    accounts,
    loading,
    error,
    metrics,
    addAccount,
    editAccount: updateAccount,
    removeAccount: deleteAccount,
  };
}
