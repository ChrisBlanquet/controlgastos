import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import { createCategory, subscribeCategories } from "../services/categoryService";

export function useCategories(user) {
  const [custom, setCustom] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCustom([]);
      setLoading(false);
      return undefined;
    }

    return subscribeCategories(
      (items) => {
        setCustom(items);
        setLoading(false);
      },
      () => {
        setCustom([]);
        setLoading(false);
      }
    );
  }, [user]);

  const categories = useMemo(() => {
    const extras = custom.map((item) => ({
      ...item,
      name: item.name || "Categoría",
      isDefault: false,
    }));
    return [...DEFAULT_CATEGORIES, ...extras];
  }, [custom]);

  const addCategory = useCallback(
    (payload) => createCategory(payload, user?.uid),
    [user]
  );

  return { categories, loading, addCategory };
}
