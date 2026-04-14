import { RefreshCw, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export const statCards = [
    { label: "Négociations en cours", value: 15,    icon: RefreshCw,     border: "border-l-green-700",   iconBg: "bg-green-100",  iconColor: "text-green-700",  val: "text-green-800"  },
    { label: "Blocages actifs",        value: 3,     icon: AlertTriangle, border: "border-l-red-400",     iconBg: "bg-red-100",    iconColor: "text-red-500",    val: "text-red-600"    },
    { label: "Accords proches",        value: 8,     icon: CheckCircle,   border: "border-l-emerald-400", iconBg: "bg-emerald-100",iconColor: "text-emerald-500",val: "text-emerald-700"},
    { label: "Taux de résolution",     value: "78%", icon: TrendingUp,    border: "border-l-blue-400",    iconBg: "bg-blue-100",   iconColor: "text-blue-500",   val: "text-blue-700"   },
];