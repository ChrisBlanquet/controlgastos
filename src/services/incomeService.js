import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { incomeDocId } from "../utils/income";
import { roundMoney, toSafeNumber } from "../utils/numbers";
import { mapFirestoreError } from "./accountService";

const INCOMES = "incomes";

export function subscribeIncomes(onData, onError) {
  return onSnapshot(
    collection(db, INCOMES),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => String(b.monthYear || b.month || b.id).localeCompare(String(a.monthYear || a.month || a.id)));
      onData(items);
    },
    onError
  );
}

export async function upsertIncome(monthYear, payload, ownerUid) {
  const baseSalary = toSafeNumber(payload.baseSalary, 0);
  const extraIncome = toSafeNumber(payload.extraIncome, 0);
  const totalIncome = roundMoney(baseSalary + extraIncome);

  try {
    await setDoc(
      doc(db, INCOMES, incomeDocId(monthYear)),
      {
        monthYear,
        baseSalary,
        extraIncome,
        totalIncome,
        ownerUid: ownerUid || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
