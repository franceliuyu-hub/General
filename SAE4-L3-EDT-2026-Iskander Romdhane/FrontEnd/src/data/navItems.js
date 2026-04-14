import { LayoutDashboard, RefreshCw, ClipboardList, Calendar, BarChart2 } from "lucide-react";

export const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "negociations", label: "Creer negociation", icon: RefreshCw, path: "/negociations" },
    { id: "mes-negociations", label: "Mes negociations", icon: ClipboardList, path: "/mes-negociations" },
    { id: "emplois", label: "Mes emplois du temps", icon: Calendar, path: "/emplois" },
    { id: "statistiques", label: "Statistiques", icon: BarChart2, path: "/statistiques" },
];
