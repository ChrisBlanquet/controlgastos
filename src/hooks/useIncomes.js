import { useCallback, useEffect, useState } from "react";
import { subscribeIncomes, upsertIncome } from "../services/incomeService";
import { incomeDocId } from "../utils/income";

export function useIncomes(user) {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIncomes([]);
      setLoading(false);
      return undefined;
    }

    return subscribeIncomes(
      (items) => {
        setIncomes(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const saveIncome = useCallback(
    (monthYear, payload) => upsertIncome(monthYear, payload, user?.uid),
    [user]
  );

  function incomeFor(monthYear) {
    return (
      incomes.find(
        (item) =>
          item.monthYear === monthYear ||
          item.month === monthYear ||
          item.id === monthYear ||
          item.id === incomeDocId(monthYear)
      ) ?? null
    );
  }

  return { incomes, loading, saveIncome, incomeFor };
}
