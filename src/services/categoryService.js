import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { mapFirestoreError } from "./accountService";

const CATEGORIES = "categories";

export function subscribeCategories(onData, onError) {
  return onSnapshot(
    query(collection(db, CATEGORIES), orderBy("createdAt", "asc")),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      ),
    onError
  );
}

export async function createCategory(payload, ownerUid) {
  try {
    const reference = await addDoc(collection(db, CATEGORIES), {
      name: String(payload.name || "").trim(),
      icon: payload.icon || "Sparkles",
      color: payload.color || "emerald",
      ownerUid: ownerUid || null,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
