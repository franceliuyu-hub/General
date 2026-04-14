import {
    LayoutDashboard, RefreshCw, ClipboardList,
    Calendar, BarChart2, Settings,
} from "lucide-react";

const icons = {
    negociations: RefreshCw,
    demandes: ClipboardList,
    emplois: Calendar,
    statistiques: BarChart2,
    parametres: Settings,
};

const titles = {
    negociations: "Négociations en cours",
    demandes: "Mes demandes",
    emplois: "Emplois du temps",
    statistiques: "Statistiques",
    parametres: "Paramètres",
};

const Placeholder = ({ page }) => {
    const Icon = icons[page] || LayoutDashboard;
    return (
        <main className="p-7 flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Icon size={32} className="text-green-400" />
                </div>
                <p className="text-lg font-bold text-green-900 capitalize">
                    {titles[page] || page}
                </p>
                <p className="text-sm text-gray-400">Cette page sera bientôt disponible</p>
            </div>
        </main>
    );
};

export default Placeholder;