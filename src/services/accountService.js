import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { isKnownBank } from "../constants/banks";
import { roundMoney, toOptionalNumber, toSafeNumber } from "../utils/numbers";

const ACCOUNTS = "accounts";

function accountsRef() {
  return collection(db, ACCOUNTS);
}

function mapAccount(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export function mapFirestoreError(error) {
  const code = error?.code || "";

  if (code === "permission-denied") {
    return "No hay permisos para guardar. Revisa las reglas de Firestore e inicia sesión con tu correo autorizado.";
  }

  if (code === "unavailable" || code === "deadline-exceeded") {
    return "Sin conexión con Firestore. Revisa tu internet e inténtalo de nuevo.";
  }

  return error?.message || "No se pudo guardar la cuenta. Inténtalo de nuevo.";
}

export function normalizeAccountPayload(payload) {
  const bank = isKnownBank(payload.bank) ? payload.bank : "otro";
  const customBank =
    bank === "otro" ? String(payload.customBank || "").trim() || null : null;

  return {
    name: String(payload.name || "").trim(),
    bank,
    customBank,
    type: payload.type === "loan" ? "loan" : "credit_card",
    creditLimit: toSafeNumber(payload.creditLimit, 0),
    currentBalance: toSafeNumber(payload.currentBalance, 0),
    cutoffDay: toSafeNumber(payload.cutoffDay, 1),
    paymentDueDays: toSafeNumber(payload.paymentDueDays, 20),
    interestRate: toOptionalNumber(payload.interestRate),
    themeColor: payload.themeColor || "from-zinc-400 to-neutral-950",
    lastFour: String(payload.lastFour || "").replace(/\D/g, "").slice(-4),
    issuer: payload.issuer === "mastercard" ? "mastercard" : "visa",
    includeCutoffDayInCycle: payload.includeCutoffDayInCycle === true,
  };
}

export async function getAccounts() {
  const snapshot = await getDocs(query(accountsRef(), orderBy("createdAt", "desc")));
  return mapAccount(snapshot);
}

export function subscribeAccounts(onData, onError) {
  return onSnapshot(
    query(accountsRef(), orderBy("createdAt", "desc")),
    (snapshot) => onData(mapAccount(snapshot)),
    onError
  );
}

export async function createAccount(payload, ownerUid) {
  try {
    const data = normalizeAccountPayload(payload);
    const reference = await addDoc(accountsRef(), {
      ...data,
      ownerUid: ownerUid || null,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function updateAccount(id, payload) {
  try {
    await updateDoc(doc(db, ACCOUNTS, id), normalizeAccountPayload(payload));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function deleteAccount(id) {
  try {
    await deleteDoc(doc(db, ACCOUNTS, id));
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function setAccountBalance(id, currentBalance) {
  try {
    await updateDoc(doc(db, ACCOUNTS, id), {
      currentBalance: Math.max(0, roundMoney(currentBalance)),
    });
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function adjustAccountBalance(accountId, delta) {
  if (!accountId || !delta) return;

  try {
    const reference = doc(db, ACCOUNTS, accountId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) return;

      const current = toSafeNumber(snapshot.data().currentBalance, 0);
      transaction.update(reference, {
        currentBalance: Math.max(0, roundMoney(current + delta)),
      });
    });
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
