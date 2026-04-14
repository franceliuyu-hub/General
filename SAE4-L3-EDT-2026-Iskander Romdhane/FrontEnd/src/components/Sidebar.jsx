import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Menu, Settings, X } from "lucide-react";
import { navItems } from "../data/navItems";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";

const sidebar = [
    { icon: Settings, label: "Profil", path: "/profil" },
    { icon: LogOut, label: "Deconnexion", path: null },
];

const Sidebar = ({ open, setOpen }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isActive = (path) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    const handleBottomAction = (path) => {
        if (!path) {
            setShowLogoutConfirm(true);
            return;
        }

        navigate(path);
    };

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate("/login", { replace: true });
    };

    return (
        <>
            <aside
                className={`${
                    open ? "w-56" : "w-16"
                } fixed top-0 left-0 z-50 flex min-h-screen flex-col bg-green-950 shadow-xl transition-all duration-300`}
            >
                <div
                    className={`flex items-center gap-3 border-b border-white/10 px-4 py-5 ${
                        !open && "justify-center"
                    }`}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-400">
                        <BookOpen size={18} className="text-green-950" />
                    </div>
                    {open && (
                        <div>
                            <p className="text-sm font-extrabold leading-tight text-white">Scheduling</p>
                            <p className="text-xs font-bold tracking-widest text-green-400">TRANSFORMER</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setOpen((prev) => !prev)}
                    className={`mt-1 flex py-2 text-green-400 transition-colors hover:text-white ${
                        open ? "justify-end pr-4" : "justify-center"
                    }`}
                >
                    {open ? <X size={15} /> : <Menu size={15} />}
                </button>

                <nav className="flex-1 space-y-1 px-2 pt-1">
                    {navItems.map(({ id, label, icon: Icon, path }) => {
                        const active = isActive(path);
                        return (
                            <button
                                key={id}
                                onClick={() => navigate(path)}
                                className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                    !open && "justify-center"
                                } flex items-center gap-3 ${
                                    active
                                        ? "bg-green-400 font-bold text-green-950 shadow"
                                        : "text-green-300 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon size={17} className="shrink-0" />
                                {open && <span className="truncate">{label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-2 space-y-1 border-t border-white/10 px-2 pb-4 pt-2">
                    {sidebar.map(({ icon: Icon, label, path }) => (
                        <button
                            key={label}
                            onClick={() => handleBottomAction(path)}
                            className={`w-full rounded-xl px-3 py-2 text-sm transition-all ${
                                !open && "justify-center"
                            } flex items-center gap-3 ${
                                path && isActive(path)
                                    ? "bg-green-400 font-bold text-green-950"
                                    : "text-green-400 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <Icon size={16} className="shrink-0" />
                            {open && <span>{label}</span>}
                        </button>
                    ))}
                </div>
            </aside>

            <ConfirmDialog
                open={showLogoutConfirm}
                title="Confirmer la deconnexion"
                message="Voulez-vous vraiment vous deconnecter ? Vous serez renvoye vers la page de connexion."
                confirmLabel="Se deconnecter"
                cancelLabel="Annuler"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </>
    );
};

export default Sidebar;
