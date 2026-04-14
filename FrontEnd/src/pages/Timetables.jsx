import { useEffect, useState } from "react";
import { CalendarRange, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserEmplois } from "../lib/api.js";
import { formatDateTime, formatPercent, formatStatus } from "../lib/negotiationHelpers.js";
import StatusBadge from "../components/ui/StatusBadge.jsx";

const Timetables = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [emplois, setEmplois] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadEmplois = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const data = await getUserEmplois(currentUser.id);
                setEmplois(data);
                setError("");
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        loadEmplois();
    }, [currentUser]);

    return (
        <main className="flex-1 p-7">
            <div className="mb-6 rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">Synchronisation</p>
                <h1 className="mt-3 text-3xl font-extrabold text-green-950">Mes emplois du temps</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Chaque negotiation sauvegardee est automatiquement ajoutee ici. Si vous supprimez une negotiation depuis l'historique, l'entree associee disparait aussi de cette page.
                </p>
            </div>

            {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            {loading ? (
                <div className="rounded-[2rem] border border-gray-100 bg-white px-6 py-10 text-sm font-semibold text-gray-500 shadow-sm">Chargement des emplois du temps...</div>
            ) : emplois.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="rounded-2xl bg-green-50 p-4 text-green-700">
                        <CalendarRange size={28} />
                    </div>
                    <p className="text-lg font-bold text-green-950">Aucun emploi du temps synchronise</p>
                    <p className="max-w-xl text-sm text-gray-500">
                        Finalisez puis confirmez une negotiation pour la retrouver automatiquement dans cette section.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {emplois.map((emploi) => (
                        <div key={emploi.id} className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-green-600">{emploi.promotion}</p>
                                    <h2 className="mt-2 text-lg font-extrabold text-green-950">{emploi.negotiationTitle}</h2>
                                </div>
                                <StatusBadge status={formatStatus(emploi.statut)} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-gray-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Niveau</p>
                                    <p className="mt-2 font-semibold text-gray-700">{emploi.niveau}</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Filiere</p>
                                    <p className="mt-2 font-semibold text-gray-700">{emploi.filiere}</p>
                                </div>
                                <div className="rounded-2xl bg-green-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-green-700">Creneau</p>
                                    <p className="mt-2 font-semibold text-green-900">{emploi.finalSlot || "-"}</p>
                                </div>
                                <div className="rounded-2xl bg-blue-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Satisfaction</p>
                                    <p className="mt-2 font-semibold text-blue-900">{formatPercent(emploi.scoreSatisfaction)}</p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                                <span>{emploi.anneeUniversitaire}</span>
                                <span>{formatDateTime(emploi.generatedAt)}</span>
                            </div>

                            <button
                                onClick={() => navigate(`/mes-negociations/${emploi.negotiationId}`)}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-green-100 px-4 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
                            >
                                <Eye size={15} />
                                Voir la negotiation
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default Timetables;
