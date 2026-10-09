import { CreditCard, Landmark, LayoutDashboard, PieChart, Wallet } from "lucide-react";

export const NAV_ITEMS = [
  { id: "home", label: "Inicio / Movimientos", shortLabel: "Inicio", icon: LayoutDashboard },
  { id: "cards", label: "Mis Tarjetas", shortLabel: "Tarjetas", icon: CreditCard },
  { id: "loans", label: "Préstamos Personales", shortLabel: "Préstamos", icon: Landmark },
  { id: "income", label: "Sueldo e Ingresos", shortLabel: "Ingresos", icon: Wallet },
  { id: "metrics", label: "Centro de decisión", shortLabel: "Decisión", icon: PieChart },
];
