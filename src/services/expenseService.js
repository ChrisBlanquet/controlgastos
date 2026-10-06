import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { toOptionalNumber, toSafeNumber } from "../utils/numbers";
import { mapFirestoreError } from "./accountService";

const EXPENSES = "expenses";

function expensesRef() {
  return collection(db, EXPENSES);
}

function mapExpenses(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export function normalizeExpensePayload(payload) {
  const isMsi = Boolean(payload.isMsi);
  const totalAmount = toSafeNumber(payload.totalAmount, 0);
  const totalInstallments = isMsi ? Math.max(1, toSafeNumber(payload.totalInstallments, 1)) : 1;
  const monthlyPayment = toSafeNumber(
    payload.monthlyPayment,
    totalInstallments > 0 ? totalAmount / totalInstallments : totalAmount
  );
  const remainingRaw = payload.remainingInstallments;
  const remainingInstallments = Math.min(
    totalInstallments,
    remainingRaw == null ? totalInstallments : Math.max(0, toSafeNumber(remainingRaw, totalInstallments))
  );

  return {
    accountId: String(payload.accountId || ""),
    title: String(payload.title || "").trim(),
    category: payload.category || "Otro",
    purchaseDate: payload.purchaseDate,
    totalAmount,
    isMsi,
    totalInstallments,
    remainingInstallments,
    monthlyPayment,
    cashbackEarned: toOptionalNumber(payload.cashbackEarned) ?? 0,
    status: remainingInstallments <= 0 ? "paid" : payload.status === "paid" ? "paid" : "pending",
  };
}

export function subscribeExpenses(onData, onError) {
  return onSnapshot(
    query(expensesRef(), orderBy("purchaseDate", "desc")),
    (snapshot) => onData(mapExpenses(snapshot)),
    onError
  );
}

export async function createExpense(payload, ownerUid) {
  try {
    const data = normalizeExpensePayload({
      ...payload,
      remainingInstallments: payload.remainingInstallments ?? payload.totalInstallments,
      status: "pending",
    });

    const reference = await addDoc(expensesRef(), {
      ...data,
      ownerUid: ownerUid || null,
      createdAt: serverTimestamp(),
    });

    return reference.id;
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function updateExpense(id, payload, previous) {
  try {
    const data = normalizeExpensePayload({
      ...previous,
      ...payload,
      remainingInstallments:
        payload.remainingInstallments ?? previous?.remainingInstallments,
    });

    await updateDoc(doc(db, EXPENSES, id), data);
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function deleteExpense(expense) {
  try {
    await deleteDoc(doc(db, EXPENSES, expense.id));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function advanceInstallments(expense, count = 1) {
  const remaining = toSafeNumber(expense.remainingInstallments, 0);
  const steps = Math.min(remaining, Math.max(1, toSafeNumber(count, 1)));
  if (steps <= 0) return;

  const remainingInstallments = remaining - steps;
  await updateExpense(
    expense.id,
    {
      remainingInstallments,
      status: remainingInstallments <= 0 ? "paid" : "pending",
    },
    expense
  );
}

export async function toggleExpenseStatus(expense) {
  if (expense.status === "paid") {
    await updateExpense(
      expense.id,
      {
        status: "pending",
        remainingInstallments: Math.max(1, toSafeNumber(expense.remainingInstallments, 0) || 1),
      },
      expense
    );
    return;
  }

  await updateExpense(
    expense.id,
    {
      status: "paid",
      remainingInstallments: 0,
    },
    expense
  );
}
