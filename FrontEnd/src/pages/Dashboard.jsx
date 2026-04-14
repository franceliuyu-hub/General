import { useEffect, useState } from "react";
import { Calendar, ClipboardList, RefreshCw, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserEmplois, getUserNegotiations } from "../lib/api.js";
import { formatDateTime, formatPercent, formatStatus } from "../lib/negotiationHelpers.js";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Section from "../components/ui/Section.jsx";

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [negotiations, setNegotiations] = useState([]);
    const [emplois, setEmplois] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tables, setTables] = useState({ neg: true, emp: true });

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const [userNegotiations, userEmplois] = await Promise.all([
                    getUserNegotiations(currentUser.id),
                    getUserEmplois(currentUser.id),
                ]);
                setNegotiations(userNegotiations);
                setEmplois(userEmplois);
                setError("");
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    const statCards = [
        { label: "Negotiations sauvegardees", value: negotiations.length, icon: ClipboardList, border: "border-l-green-500", iconBg: "bg-green-50", iconColor: "text-green-700", val: "text-green-900" },
        { label: "Negotiations resolues", value: negotiations.filter((item) => item.statut === "RESOLUE").length, icon: RefreshCw, border: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-700", val: "text-emerald-900" },
        { label: "Emplois synchronises", value: emplois.length, icon: Calendar, border: "border-l-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-700", val: "text-blue-900" },
        { label: "Satisfaction moyenne", value: emplois.length > 0 ? `${Math.round((emplois.reduce((total, emploi) => total + (emploi.scoreSatisfaction || 0), 0) / emplois.length) * 100)}%` : "0%", icon: TrendingUp, border: "border-l-amber-500", iconBg: "bg-amber-50", iconColor: "text-amber-700", val: "text-amber-900" },
    ];

    return (
        <main className="flex-1 p-7">
            <div className="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon, border, iconBg, iconColor, val }) => (
                    <div key={label} className={`flex items-center gap-4 rounded-2xl border border-gray-100 border-l-4 bg-white p-5 shadow-sm ${border}`}>
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                            <Icon size={21} className={iconColor} />
                        </div>
                        <div>
                            <p className={`text-2xl font-extrabold ${val}`}>{value}</p>
                            <p className="mt-0.5 text-xs leading-tight text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <Section title="Dernieres negociations" icon={RefreshCw} expanded={tables.neg} onToggle={() => setTables((prev) => ({ ...prev, neg: !prev.neg }))} action="Voir l'historique">
                {loading ? (
                    <div className="px-5 py-8 text-sm font-semibold text-gray-500">Chargement...</div>
                ) : negotiations.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-gray-500">Aucune negotiation sauvegardee pour le moment.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    {["Nom", "Niveau", "Filiere", "Creneau final", "Score", "Statut", "Date"].map((label) => (
                                        <th key={label} className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {negotiations.slice(0, 5).map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50">
                                        <td className="px-4 py-3 font-semibold text-green-900">{item.titre}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.niveau || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.filiere || "-"}</td>
                                        <td className="px-4 py-3 text-green-700">{item.finalSlot || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatPercent(item.scoreConsensus)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={formatStatus(item.statut)} /></td>
                                        <td className="px-4 py-3 text-gray-500">{formatDateTime(item.dateOuverture)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-4">
                            <button onClick={() => navigate("/mes-negociations")} className="text-sm font-bold text-green-700 underline">
                                Voir toutes les negociations
                            </button>
                        </div>
                    </div>
                )}
            </Section>

            <Section title="Mes emplois du temps" icon={Calendar} expanded={tables.emp} onToggle={() => setTables((prev) => ({ ...prev, emp: !prev.emp }))} action="Voir tous">
                {loading ? (
                    <div className="px-5 py-8 text-sm font-semibold text-gray-500">Chargement...</div>
                ) : emplois.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-gray-500">Aucun emploi du temps synchronise pour le moment.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    {["Negotiation", "Promotion", "Creneau", "Satisfaction", "Statut", "Generation"].map((label) => (
                                        <th key={label} className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {emplois.slice(0, 5).map((emploi) => (
                                    <tr key={emploi.id} className="border-b border-gray-50">
                                        <td className="px-4 py-3 font-semibold text-green-900">{emploi.negotiationTitle}</td>
                                        <td className="px-4 py-3 text-gray-600">{emploi.promotion}</td>
                                        <td className="px-4 py-3 text-green-700">{emploi.finalSlot || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatPercent(emploi.scoreSatisfaction)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={formatStatus(emploi.statut)} /></td>
                                        <td className="px-4 py-3 text-gray-500">{formatDateTime(emploi.generatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-4">
                            <button onClick={() => navigate("/emplois")} className="text-sm font-bold text-green-700 underline">
                                Voir tous les emplois du temps
                            </button>
                        </div>
                    </div>
                )}
            </Section>
        </main>
    );
};

export default Dashboard;
