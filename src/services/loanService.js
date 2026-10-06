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
import { roundMoney, toSafeNumber } from "../utils/numbers";
import { mapFirestoreError } from "./accountService";

const LOANS = "loans";

function mapLoans(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function normalizeLoanPayload(payload) {
  const capital = toSafeNumber(payload.breakdown?.capital ?? payload.capital, 0);
  const interest = toSafeNumber(payload.breakdown?.interest ?? payload.interest, 0);
  const vat = toSafeNumber(payload.breakdown?.vat ?? payload.vat, roundMoney(interest * 0.16));
  const remaining = Math.max(0, toSafeNumber(payload.remainingInstallments, payload.totalInstallments || 0));

  return {
    name: String(payload.name || "").trim(),
    institution: String(payload.institution || "").trim(),
    initialPrincipal: toSafeNumber(payload.initialPrincipal, 0),
    currentBalance: toSafeNumber(payload.currentBalance, payload.initialPrincipal || 0),
    totalInstallments: Math.max(1, toSafeNumber(payload.totalInstallments, 1)),
    remainingInstallments: remaining,
    monthlyPayment: toSafeNumber(payload.monthlyPayment, 0),
    breakdown: { capital, interest, vat },
    paymentDay: Math.min(31, Math.max(1, toSafeNumber(payload.paymentDay, 1))),
    status: remaining <= 0 ? "paid" : payload.status === "paid" ? "paid" : "active",
  };
}

export function subscribeLoans(onData, onError) {
  return onSnapshot(
    query(collection(db, LOANS), orderBy("createdAt", "desc")),
    (snapshot) => onData(mapLoans(snapshot)),
    onError
  );
}

export async function createLoan(payload, ownerUid) {
  try {
    const data = normalizeLoanPayload({
      ...payload,
      remainingInstallments: payload.remainingInstallments ?? payload.totalInstallments,
    });
    const reference = await addDoc(collection(db, LOANS), {
      ...data,
      ownerUid: ownerUid || null,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function updateLoan(id, payload) {
  try {
    await updateDoc(doc(db, LOANS, id), normalizeLoanPayload(payload));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function deleteLoan(id) {
  try {
    await deleteDoc(doc(db, LOANS, id));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function payLoanInstallment(loan) {
  const remaining = Math.max(0, toSafeNumber(loan.remainingInstallments, 0) - 1);
  const nextBalance = Math.max(
    0,
    roundMoney(toSafeNumber(loan.currentBalance, 0) - toSafeNumber(loan.monthlyPayment, 0))
  );

  try {
    await updateDoc(doc(db, LOANS, loan.id), {
      remainingInstallments: remaining,
      currentBalance: remaining <= 0 ? 0 : nextBalance,
      status: remaining <= 0 ? "paid" : "active",
    });
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
