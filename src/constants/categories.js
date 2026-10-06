import {
  Car,
  Coffee,
  Dog,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Plane,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tv,
  Utensils,
  Zap,
} from "lucide-react";

export const CATEGORY_ICONS = {
  Utensils,
  Zap,
  Tv,
  HeartPulse,
  Car,
  ShoppingBag,
  Dog,
  Dumbbell,
  Shirt,
  Plane,
  Coffee,
  Gift,
  Home,
  Laptop,
  GraduationCap,
  Sparkles,
  ShoppingCart,
};

export const ICON_OPTIONS = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  { id: "emerald", chip: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30", icon: "text-emerald-300 bg-emerald-400/10" },
  { id: "indigo", chip: "bg-indigo-400/15 text-indigo-200 border-indigo-400/30", icon: "text-indigo-300 bg-indigo-400/10" },
  { id: "rose", chip: "bg-rose-400/15 text-rose-300 border-rose-400/30", icon: "text-rose-300 bg-rose-400/10" },
  { id: "amber", chip: "bg-amber-400/15 text-amber-200 border-amber-400/30", icon: "text-amber-300 bg-amber-400/10" },
  { id: "cyan", chip: "bg-cyan-400/15 text-cyan-200 border-cyan-400/30", icon: "text-cyan-300 bg-cyan-400/10" },
  { id: "fuchsia", chip: "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-400/30", icon: "text-fuchsia-300 bg-fuchsia-400/10" },
  { id: "sky", chip: "bg-sky-400/15 text-sky-200 border-sky-400/30", icon: "text-sky-300 bg-sky-400/10" },
  { id: "orange", chip: "bg-orange-400/15 text-orange-200 border-orange-400/30", icon: "text-orange-300 bg-orange-400/10" },
];

export const MSI_TERMS = [3, 6, 9, 12, 18, 24];

export const DEFAULT_CATEGORIES = [
  { id: "Alimentos", name: "Alimentos", icon: "Utensils", color: "emerald", isDefault: true },
  { id: "Servicios", name: "Servicios", icon: "Zap", color: "amber", isDefault: true },
  { id: "Entretenimiento", name: "Entretenimiento", icon: "Tv", color: "indigo", isDefault: true },
  { id: "Salud", name: "Salud", icon: "HeartPulse", color: "rose", isDefault: true },
  { id: "Transporte", name: "Transporte", icon: "Car", color: "sky", isDefault: true },
  { id: "Tecnología", name: "Tecnología", icon: "Laptop", color: "cyan", isDefault: true },
];

export function getCategoryIcon(iconName) {
  return CATEGORY_ICONS[iconName] ?? Sparkles;
}

export function getCategoryColor(colorId) {
  return CATEGORY_COLORS.find((item) => item.id === colorId) ?? CATEGORY_COLORS[0];
}

export function resolveCategory(key, categories = DEFAULT_CATEGORIES) {
  return (
    categories.find((item) => item.id === key || item.name === key) ?? {
      id: key,
      name: key || "Categoría",
      icon: "Sparkles",
      color: "indigo",
    }
  );
}
