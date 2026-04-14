import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Target, TrendingUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getNegotiationDetails } from "../lib/api.js";
import { formatDateTime, formatPercent, formatStatus } from "../lib/negotiationHelpers.js";
import StatusBadge from "../components/ui/StatusBadge.jsx";

const ScoreRow = ({ label, value }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-extrabold text-green-800">{formatPercent(value)}</p>
    </div>
);

const NegotiationDetails = () => {
    const navigate = useNavigate();
    const { negotiationId } = useParams();
    const { currentUser } = useAuth();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDetails = async () => {
            if (!currentUser || !negotiationId) return;
            setLoading(true);
            try {
                const data = await getNegotiationDetails(currentUser.id, negotiationId);
                setDetails(data);
                setError("");
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        loadDetails();
    }, [currentUser, negotiationId]);

    if (loading) {
        return <main className="flex-1 p-7 text-sm font-semibold text-gray-500">Chargement des details...</main>;
    }

    if (error || !details) {
        return (
            <main className="flex-1 p-7">
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error || "Negotiation introuvable."}
                </div>
            </main>
        );
    }

    const finalScores = details.negotiationResponse?.final_scores || {};
    const rounds = details.negotiationResponse?.negotiation_rounds || [];

    return (
        <main className="flex-1 p-7">
            <button
                onClick={() => navigate("/mes-negociations")}
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
                <ArrowLeft size={15} />
                Retour a l'historique
            </button>

            <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">Detail negotiation</p>
                        <h1 className="mt-3 text-3xl font-extrabold text-green-950">{details.titre}</h1>
                        <p className="mt-2 max-w-3xl text-sm text-gray-500">{details.description || "Aucune description fournie."}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <StatusBadge status={formatStatus(details.statut)} />
                            <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                                {details.niveau} - {details.filiere}
                            </span>
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                                {details.scenarioId || "Sans scenario"}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Ouverture</p>
                            <p className="mt-2 text-sm font-semibold text-gray-700">{formatDateTime(details.dateOuverture)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cloture</p>
                            <p className="mt-2 text-sm font-semibold text-gray-700">{formatDateTime(details.dateCloture)}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-700"><Target size={16} /><p className="text-xs font-bold uppercase tracking-wide">Creneau final</p></div>
                        <p className="mt-3 text-xl font-extrabold text-green-900">{details.finalSlot || "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 text-blue-700"><Clock3 size={16} /><p className="text-xs font-bold uppercase tracking-wide">Creneau cible</p></div>
                        <p className="mt-3 text-xl font-extrabold text-blue-900">{details.targetSlot || "-"}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 text-emerald-700"><TrendingUp size={16} /><p className="text-xs font-bold uppercase tracking-wide">Score global</p></div>
                        <p className="mt-3 text-xl font-extrabold text-emerald-900">{formatPercent(details.scoreConsensus)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Tours</p>
                        <p className="mt-3 text-xl font-extrabold text-gray-800">{rounds.length}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <ScoreRow label="Salle" value={finalScores.room} />
                    <ScoreRow label="Enseignant" value={finalScores.teacher} />
                    <ScoreRow label="Etudiants" value={finalScores.student} />
                    <ScoreRow label="Global" value={finalScores.global} />
                </div>

                <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-sm font-bold text-green-900">Rounds de negociation</p>
                    <div className="mt-4 space-y-3">
                        {rounds.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun round detaille n'a ete renvoye.</p>
                        ) : (
                            rounds.map((round) => (
                                <div key={round.round} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Round {round.round}</p>
                                            <p className="mt-1 text-xs text-gray-500">{round.explanation}</p>
                                        </div>
                                        <div className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                                            {round.proposed_slot}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default NegotiationDetails;
