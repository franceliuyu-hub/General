import { useLocation, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const pageTitles = {
    "/": { title: "Dashboard", sub: "Vue d'ensemble de vos negociations et emplois du temps" },
    "/negociations": { title: "Creer negociation", sub: "Preparez et lancez une nouvelle negociation" },
    "/mes-negociations": { title: "Mes negociations", sub: "Historique, details et suppression de vos negociations" },
    "/emplois": { title: "Mes emplois du temps", sub: "Negotiations finalisees synchronisees dans le planning" },
    "/statistiques": { title: "Statistiques", sub: "Analyse et indicateurs" },
    "/profil": { title: "Mon Profil", sub: "Informations personnelles" },
    "/mot-de-passe": { title: "Mot de passe", sub: "Mise a jour de la securite du compte" },
    "/parametres": { title: "Parametres", sub: "Configuration du compte" },
};

const Topbar = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { currentUser } = useAuth();
    const currentPage =
        Object.entries(pageTitles).find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ||
        pageTitles["/"];

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-7 shadow-sm">
            <div className="flex items-center gap-3">
                <h1 className="text-base font-bold text-green-900">{currentPage.title}</h1>
                <span className="hidden text-xs font-medium text-gray-400 sm:block">{currentPage.sub}</span>
            </div>
            <div className="flex items-center gap-4">
                <button className="relative text-gray-500 transition-colors hover:text-green-700">
                    <Bell size={19} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        3
                    </span>
                </button>
                <button
                    onClick={() => navigate("/profil")}
                    className="flex items-center gap-2.5 rounded-full border border-green-100 bg-green-50 py-1 pl-1 pr-4 transition-colors hover:bg-green-100"
                >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-200">
                        <User size={13} className="text-green-800" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold leading-tight text-green-900">
                            {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : "Utilisateur"}
                        </p>
                        <p className="text-xs text-green-600">@{currentUser?.username || "compte"}</p>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Topbar;
