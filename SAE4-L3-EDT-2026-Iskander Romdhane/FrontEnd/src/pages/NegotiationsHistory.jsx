import { useEffect, useState } from "react";
import { Eye, Plus, Trash2, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteNegotiation, getUserNegotiations } from "../lib/api.js";
import { formatDateTime, formatPercent, formatStatus } from "../lib/negotiationHelpers.js";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";

const NegotiationsHistory = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [targetDelete, setTargetDelete] = useState(null);

    const loadNegotiations = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await getUserNegotiations(currentUser.id);
            setNegotiations(data);
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNegotiations();
    }, [currentUser]);

    const handleDelete = async () => {
        if (!targetDelete || !currentUser) return;
        try {
            await deleteNegotiation(currentUser.id, targetDelete.id);
            setTargetDelete(null);
            await loadNegotiations();
        } catch (requestError) {
            setError(requestError.message);
            setTargetDelete(null);
        }
    };

    return (
        <main className="flex-1 p-7">
            <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">Historique</p>
                    <h1 className="mt-3 text-3xl font-extrabold text-green-950">Mes negociations</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Retrouvez vos negociations sauvegardees, ouvrez les details et supprimez celles qui ne sont plus utiles.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/negociations")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
                >
                    <Plus size={16} />
                    Creer negociation
                </button>
            </div>

            {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                {loading ? (
                    <div className="px-6 py-10 text-sm font-semibold text-gray-500">Chargement de vos negociations...</div>
                ) : negotiations.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                        <div className="rounded-2xl bg-green-50 p-4 text-green-700">
                            <ClipboardList size={28} />
                        </div>
                        <p className="text-lg font-bold text-green-950">Aucune negotiation sauvegardee</p>
                        <p className="max-w-xl text-sm text-gray-500">
                            Lancez une nouvelle negotiation, puis confirmez la sauvegarde finale pour la retrouver ici.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    {["Nom", "Niveau", "Filiere", "Creneau final", "Score", "Statut", "Ouverture", "Actions"].map((label) => (
                                        <th key={label} className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {negotiations.map((negotiation, index) => (
                                    <tr key={negotiation.id} className={`border-b border-gray-50 ${index % 2 ? "bg-gray-50/40" : ""}`}>
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-green-900">{negotiation.titre}</p>
                                            <p className="mt-1 text-xs text-gray-400">{negotiation.scenarioId || "Sans scenario"}</p>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{negotiation.niveau || "-"}</td>
                                        <td className="px-4 py-4 text-gray-600">{negotiation.filiere || "-"}</td>
                                        <td className="px-4 py-4 font-semibold text-green-700">{negotiation.finalSlot || "-"}</td>
                                        <td className="px-4 py-4 text-gray-600">{formatPercent(negotiation.scoreConsensus)}</td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={formatStatus(negotiation.statut)} />
                                        </td>
                                        <td className="px-4 py-4 text-gray-500">{formatDateTime(negotiation.dateOuverture)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/mes-negociations/${negotiation.id}`)}
                                                    className="rounded-xl border border-green-100 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-50"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <Eye size={14} />
                                                        Ouvrir
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setTargetDelete(negotiation)}
                                                    className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <Trash2 size={14} />
                                                        Supprimer
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={Boolean(targetDelete)}
                title="Supprimer la negotiation"
                message="Cette suppression retirera aussi l'entree associee dans Mes emplois du temps."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={handleDelete}
                onCancel={() => setTargetDelete(null)}
            />
        </main>
    );
};

export default NegotiationsHistory;
