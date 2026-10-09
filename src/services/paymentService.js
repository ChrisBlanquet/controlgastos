import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { todayISO } from "../utils/expenses";
import { roundMoney, toSafeNumber } from "../utils/numbers";
import { mapFirestoreError } from "./accountService";

const PAYMENTS = "payments";

function mapPayments(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function normalizePaymentPayload(payload) {
  const cycleKeyRaw = String(payload.cycleKey || payload.cycleMonth || "auto").trim();
  const cycleKey = cycleKeyRaw === "auto" || !cycleKeyRaw ? "auto" : cycleKeyRaw.slice(0, 7);
  return {
    accountId: String(payload.accountId || ""),
    amount: roundMoney(toSafeNumber(payload.amount, 0)),
    date: payload.date || todayISO(),
    notes: String(payload.notes || "").trim(),
    cycleKey,
    cycleMonth: cycleKey,
  };
}

export function subscribePayments(onData, onError) {
  return onSnapshot(
    collection(db, PAYMENTS),
    (snapshot) =>
      onData(
        mapPayments(snapshot).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      ),
    onError
  );
}

export async function createPayment(payload, ownerUid) {
  try {
    const data = normalizePaymentPayload(payload);
    if (!(data.amount > 0) || !data.accountId) {
      throw new Error("El abono necesita tarjeta y monto.");
    }
    if (data.cycleKey !== "auto" && !/^\d{4}-\d{2}$/.test(data.cycleKey)) {
      throw new Error("Elige el corte al que corresponde este pago.");
    }
    const reference = await addDoc(collection(db, PAYMENTS), {
      ...data,
      ownerUid: ownerUid || null,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    throw new Error(error?.message?.includes("abono") ? error.message : mapFirestoreError(error));
  }
}

export async function deletePayment(id) {
  try {
    await deleteDoc(doc(db, PAYMENTS, id));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
