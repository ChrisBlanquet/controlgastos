import { useCallback, useEffect, useMemo, useState } from "react";
import { createPayment, deletePayment, subscribePayments } from "../services/paymentService";
import { toSafeNumber } from "../utils/numbers";

export function usePayments(user) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return undefined;
    }

    return subscribePayments(
      (items) => {
        setPayments(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [user]);

  const addPayment = useCallback((payload) => createPayment(payload, user?.uid), [user]);

  const removePayment = useCallback(async (id) => {
    setPayments((current) => current.filter((payment) => payment.id !== id));
    try {
      await deletePayment(id);
    } catch (error) {
      throw error;
    }
  }, []);

  const totalByAccount = useMemo(() => {
    const totals = new Map();
    payments.forEach((payment) => {
      totals.set(payment.accountId, (totals.get(payment.accountId) || 0) + toSafeNumber(payment.amount, 0));
    });
    return totals;
  }, [payments]);

  return {
    payments,
    loading,
    addPayment,
    removePayment,
    totalByAccount,
  };
}
