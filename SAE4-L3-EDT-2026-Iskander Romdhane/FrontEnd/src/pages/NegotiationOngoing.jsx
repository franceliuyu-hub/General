import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, DoorOpen, Loader, Plus, RefreshCw, Save, TrendingUp, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { saveNegotiation, startNegotiationPreview } from "../lib/api.js";
import { formatPercent } from "../lib/negotiationHelpers.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Section from "../components/ui/Section.jsx";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const SLOT_OPTIONS = DAYS.flatMap((day) => HOURS.map((hour) => `${day}-${hour}`));
const LEVELS = ["L1", "L2", "L3", "M1", "M2"];
const createRoom = (index) => ({ room_id: `R${String(index + 1).padStart(3, "0")}`, capacity: 30, available_slots: [] });
const createScenarioId = () => `SCEN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const createInitialForm = () => ({
    scenario_id: createScenarioId(),
    timestamp: new Date().toISOString(),
    difficulty: "medium",
    room_manager: { rooms: [createRoom(0)], total_slots_available: 0 },
    teacher: { teacher_id: "T001", preferred_slots: [], unavailable_slots: [], min_slots_needed: 1 },
    students: { group_id: "G001", preferred_slots: [], constraints: { no_early_morning: false, no_late_afternoon: false, max_days_per_week: 2, preferred_days: [] } },
    all_possible_slots: [],
    target_slot: "",
});

const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500";

const Field = ({ label, children }) => (
    <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
        {children}
    </div>
);

const ScoreBar = ({ label, value, color }) => (
    <div className="flex items-center gap-3">
        <span className="w-16 text-xs font-semibold text-gray-600">{label}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(value || 0) * 100}%` }} />
        </div>
        <span className="w-12 text-right text-xs font-bold text-gray-700">{formatPercent(value)}</span>
    </div>
);

const statusStyles = {
    accept: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accept_with_concession: "border-amber-200 bg-amber-50 text-amber-700",
    reject: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels = {
    accept: "Accepte",
    accept_with_concession: "Accepte avec concession",
    reject: "Refuse",
};

const SelectionChips = ({ values, onRemove }) => (
    <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {value}
                <button type="button" onClick={() => onRemove(value)} className="text-green-700 hover:text-green-900">
                    <X size={13} />
                </button>
            </span>
        ))}
    </div>
);

const SlotSelector = ({ label, selectedSlots, onToggleSlot, helperText }) => (
    <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="mt-1 text-xs text-gray-500">{helperText}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{selectedSlots.length} selection{selectedSlots.length > 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-5 gap-2">
                {DAYS.map((day) => (
                    <div key={day} className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{day}</p>
                        {HOURS.map((hour) => {
                            const slot = `${day}-${hour}`;
                            const active = selectedSlots.includes(slot);
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onToggleSlot(slot)}
                                    className={`w-full rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${active ? "border-green-600 bg-green-600 text-white" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"}`}
                                >
                                    {hour}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
        {selectedSlots.length > 0 && <SelectionChips values={selectedSlots} onRemove={onToggleSlot} />}
    </div>
);

const ResultsView = ({ metadata, response, onRestart, onSave, saving }) => {
    const [expanded, setExpanded] = useState({ rounds: true, final: true });
    const toggleSection = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <main className="flex-1 p-7">
            <div className={`mb-8 rounded-2xl border-l-4 p-6 ${response.success ? "border-emerald-400 bg-emerald-50" : "border-yellow-400 bg-yellow-50"}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{metadata.titre}</h1>
                        <p className="mt-2 text-sm text-gray-600">{metadata.niveau} - {metadata.filiere}</p>
                        <p className="mt-1 text-xs font-semibold text-green-700">{response.scenario_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Creneau final</p>
                        <p className="mt-2 text-2xl font-extrabold text-green-700">{response.final_slot || "-"}</p>
                    </div>
                </div>
            </div>

            <Section title="Rounds de negociation" icon={RefreshCw} expanded={expanded.rounds} onToggle={() => toggleSection("rounds")}>
                <div className="space-y-4 px-5 py-4">
                    {(response.negotiation_rounds || []).map((round) => (
                        <div key={round.round} className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50/50 to-transparent p-5">
                            <div className="mb-4 flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">{round.round}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">Proposition: {round.proposed_slot}</p>
                                    <p className="mt-1 text-xs text-gray-500">{round.explanation}</p>
                                    <p className="mt-2 text-xs font-semibold text-green-700">
                                        {round.accepted_by_all ? "Tous les agents peuvent vivre avec cette proposition." : "Au moins un agent demande encore un ajustement."}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3 rounded-lg bg-white p-4">
                                <ScoreBar label="Salles" value={round.scores?.room} color="bg-red-400" />
                                <ScoreBar label="Enseignant" value={round.scores?.teacher} color="bg-blue-400" />
                                <ScoreBar label="Etudiants" value={round.scores?.student} color="bg-emerald-400" />
                                <ScoreBar label="Global" value={round.scores?.global} color="bg-green-600" />
                            </div>
                            {round.agent_feedback && (
                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    {Object.entries(round.agent_feedback).map(([agent, feedback]) => (
                                        <div key={agent} className="rounded-lg border border-gray-100 bg-white p-4">
                                            <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${statusStyles[feedback.status] || "border-gray-200 bg-gray-50 text-gray-700"}`}>
                                                {agent} · {statusLabels[feedback.status] || feedback.status}
                                            </div>
                                            <p className="mt-3 text-xs text-gray-600">{feedback.message}</p>
                                            {feedback.counter_slot && (
                                                <p className="mt-2 text-xs font-semibold text-gray-700">Contre-proposition: {feedback.counter_slot}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {round.alternative_slots?.length > 0 && (
                                <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Alternatives proches</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {round.alternative_slots.map((slot) => (
                                            <span key={`${round.round}-${slot.slot}`} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                                                {slot.slot} · {formatPercent(slot.global_score)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Scores finaux" icon={TrendingUp} expanded={expanded.final} onToggle={() => toggleSection("final")}>
                <div className="grid gap-4 px-5 py-6 md:grid-cols-4">
                    <ScoreBar label="Salle" value={response.final_scores?.room} color="bg-red-400" />
                    <ScoreBar label="Enseignant" value={response.final_scores?.teacher} color="bg-blue-400" />
                    <ScoreBar label="Etudiants" value={response.final_scores?.student} color="bg-emerald-400" />
                    <ScoreBar label="Global" value={response.final_scores?.global} color="bg-green-600" />
                </div>
            </Section>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap gap-3">
                    <div className="rounded-xl bg-green-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-green-700">Statut</p>
                        <p className="mt-2 text-sm font-bold text-green-900">{response.success ? "Accord trouve" : "Resultat a verifier"}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Rounds</p>
                        <p className="mt-2 text-sm font-bold text-blue-900">{response.negotiation_rounds?.length || 0}</p>
                    </div>
                    <div className="rounded-xl bg-purple-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Consensus</p>
                        <p className="mt-2 text-sm font-bold text-purple-900">{response.accepted_by_all ? "Oui" : "Partiel"}</p>
                    </div>
                </div>
                {response.failure_reasons?.length > 0 && (
                    <div className="mb-5 rounded-xl border border-yellow-100 bg-yellow-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">Points de blocage</p>
                        <div className="mt-2 space-y-1">
                            {response.failure_reasons.map((reason) => (
                                <p key={reason} className="text-sm text-yellow-800">{reason}</p>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button onClick={onRestart} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                        Nouvelle negociation
                    </button>
                    <button onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-60">
                        {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? "Sauvegarde..." : "Confirmer et sauvegarder"}
                    </button>
                </div>
            </div>
        </main>
    );
};

const NegotiationOngoing = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formStep, setFormStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfirmSave, setShowConfirmSave] = useState(false);
    const [response, setResponse] = useState(null);
    const [requestError, setRequestError] = useState("");
    const [validationErrors, setValidationErrors] = useState([]);
    const [metadata, setMetadata] = useState({ titre: "", description: "", niveau: "L1", filiere: "Informatique" });
    const [form, setForm] = useState(createInitialForm);

    useEffect(() => {
        const uniqueSlots = Array.from(new Set([...form.room_manager.rooms.flatMap((room) => room.available_slots), ...form.teacher.preferred_slots, ...form.students.preferred_slots, ...form.all_possible_slots])).sort();
        const totalSlotsAvailable = form.room_manager.rooms.reduce((total, room) => total + room.available_slots.length, 0);
        setForm((prev) => ({ ...prev, room_manager: { ...prev.room_manager, total_slots_available: totalSlotsAvailable }, all_possible_slots: uniqueSlots, target_slot: uniqueSlots.includes(prev.target_slot) ? prev.target_slot : uniqueSlots[0] || "" }));
    }, [form.room_manager.rooms, form.teacher.preferred_slots, form.students.preferred_slots]);

    const updateForm = (path, value) => {
        const keys = path.split(".");
        setForm((prev) => {
            const copy = structuredClone(prev);
            let current = copy;
            for (let index = 0; index < keys.length - 1; index += 1) current = current[keys[index]];
            current[keys[keys.length - 1]] = value;
            return copy;
        });
    };

    const toggleSlot = (path, slot) => {
        const values = path.split(".").reduce((acc, key) => acc[key], form);
        updateForm(path, values.includes(slot) ? values.filter((value) => value !== slot) : [...values, slot].sort());
    };

    const validateForm = () => {
        const errors = [];
        if (!metadata.titre.trim()) errors.push("Le nom de la negotiation est obligatoire.");
        if (!metadata.filiere.trim()) errors.push("La filiere est obligatoire.");
        if (!form.room_manager.rooms.length) errors.push("Ajoutez au moins une salle.");
        if (!form.teacher.preferred_slots.length) errors.push("L'enseignant doit avoir au moins un creneau prefere.");
        if (!form.students.preferred_slots.length) errors.push("Les etudiants doivent avoir au moins un creneau prefere.");
        if (!form.students.constraints.preferred_days.length) errors.push("Selectionnez au moins un jour prefere pour les etudiants.");
        if (!form.target_slot) errors.push("Choisissez un creneau cible.");
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handlePreview = async () => {
        setRequestError("");
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = await startNegotiationPreview(form);
            setResponse(payload);
        } catch (error) {
            setRequestError(`${error.message}. Verifiez que le backend tourne sur http://localhost:8080 et que le service Transformer tourne sur http://localhost:8000.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentUser || !response) return;
        setSaving(true);
        try {
            const saved = await saveNegotiation(currentUser.id, {
                titre: metadata.titre,
                description: metadata.description,
                niveau: metadata.niveau,
                filiere: metadata.filiere,
                negotiationRequest: form,
                negotiationResponse: response,
            });
            navigate(`/mes-negociations/${saved.id}`);
        } catch (error) {
            setRequestError(error.message);
        } finally {
            setSaving(false);
            setShowConfirmSave(false);
        }
    };

    const addRoom = () => updateForm("room_manager.rooms", [...form.room_manager.rooms, createRoom(form.room_manager.rooms.length)]);
    const removeRoom = (index) => updateForm("room_manager.rooms", form.room_manager.rooms.filter((_, roomIndex) => roomIndex !== index));
    const updateRoom = (index, field, value) => updateForm("room_manager.rooms", form.room_manager.rooms.map((room, roomIndex) => roomIndex === index ? { ...room, [field]: value } : room));
    const toggleRoomSlot = (roomIndex, slot) => updateForm("room_manager.rooms", form.room_manager.rooms.map((room, index) => index !== roomIndex ? room : { ...room, available_slots: room.available_slots.includes(slot) ? room.available_slots.filter((value) => value !== slot) : [...room.available_slots, slot].sort() }));
    const toggleDay = (day) => {
        const current = form.students.constraints.preferred_days;
        updateForm("students.constraints.preferred_days", current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
    };

    const resetForNewNegotiation = () => {
        setResponse(null);
        setRequestError("");
        setValidationErrors([]);
        setForm((prev) => ({
            ...prev,
            scenario_id: createScenarioId(),
            timestamp: new Date().toISOString(),
        }));
    };

    if (response) {
        return (
            <>
                <ResultsView metadata={metadata} response={response} saving={saving} onRestart={resetForNewNegotiation} onSave={() => setShowConfirmSave(true)} />
                <ConfirmDialog open={showConfirmSave} title="Confirmer la sauvegarde finale" message="Voulez-vous enregistrer cette negotiation dans la base de donnees et l'ajouter a Mes emplois du temps ?" confirmLabel="Oui, sauvegarder" cancelLabel="Annuler" onConfirm={handleSave} onCancel={() => setShowConfirmSave(false)} />
            </>
        );
    }

    return (
        <main className="flex-1 p-7">
            <div className="max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-gray-900">Creer negociation</h1>
                    <p className="mt-1 text-sm text-gray-500">Renseignez les informations metier, lancez la negotiation avec le Transformer puis confirmez la sauvegarde finale.</p>
                </div>

                <div className="mb-8 flex gap-2 overflow-x-auto">
                    {["Infos", "Salles", "Enseignant", "Etudiants", "Creneaux"].map((step, index) => (
                        <button key={step} type="button" onClick={() => setFormStep(index)} className={`whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition-colors ${formStep === index ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{step}</button>
                    ))}
                </div>

                {(validationErrors.length > 0 || requestError) && (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700"><AlertCircle size={16} />Verifications a corriger</div>
                        {validationErrors.map((error) => <p key={error} className="text-sm text-red-600">{error}</p>)}
                        {requestError && <p className="mt-3 text-sm text-red-600">{requestError}</p>}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {formStep === 0 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Informations generales</h2>
                            <Field label="Nom de la negotiation"><input className={inputClass} value={metadata.titre} onChange={(event) => setMetadata((prev) => ({ ...prev, titre: event.target.value }))} /></Field>
                            <Field label="Description"><textarea className={`${inputClass} min-h-24 resize-none`} value={metadata.description} onChange={(event) => setMetadata((prev) => ({ ...prev, description: event.target.value }))} /></Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Niveau"><select className={inputClass} value={metadata.niveau} onChange={(event) => setMetadata((prev) => ({ ...prev, niveau: event.target.value }))}>{LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
                                <Field label="Filiere"><input className={inputClass} value={metadata.filiere} onChange={(event) => setMetadata((prev) => ({ ...prev, filiere: event.target.value }))} /></Field>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Scenario ID"><input className={inputClass} value={form.scenario_id} onChange={(event) => updateForm("scenario_id", event.target.value)} /></Field>
                                <Field label="Difficulte"><select className={inputClass} value={form.difficulty} onChange={(event) => updateForm("difficulty", event.target.value)}>{["easy", "medium", "hard"].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
                            </div>
                        </div>
                    )}

                    {formStep === 1 && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <div><h2 className="text-lg font-bold text-gray-900">Gestion des salles</h2><p className="mt-1 text-sm text-gray-500">Selectionnez les creneaux disponibles pour chaque salle.</p></div>
                                <div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">{form.room_manager.total_slots_available} creneaux disponibles</div>
                            </div>
                            <div className="space-y-4">
                                {form.room_manager.rooms.map((room, index) => (
                                    <div key={room.room_id + index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Salle {index + 1}</h3>
                                            {form.room_manager.rooms.length > 1 && <button type="button" onClick={() => removeRoom(index)} className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50"><X size={16} /></button>}
                                        </div>
                                        <Field label="ID Salle"><input className={inputClass} value={room.room_id} onChange={(event) => updateRoom(index, "room_id", event.target.value)} /></Field>
                                        <Field label="Capacite"><input type="number" className={inputClass} value={room.capacity} onChange={(event) => updateRoom(index, "capacity", Number(event.target.value))} /></Field>
                                        <SlotSelector label="Creneaux disponibles" selectedSlots={room.available_slots} onToggleSlot={(slot) => toggleRoomSlot(index, slot)} helperText="Cliquez sur les heures pour les ajouter ou les retirer." />
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addRoom} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 font-semibold text-green-700 transition-colors hover:bg-green-100"><Plus size={16} />Ajouter une salle</button>
                        </div>
                    )}

                    {formStep === 2 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Enseignant</h2>
                            <Field label="ID Enseignant"><input className={inputClass} value={form.teacher.teacher_id} onChange={(event) => updateForm("teacher.teacher_id", event.target.value)} /></Field>
                            <Field label="Nombre minimal de slots"><input type="number" className={inputClass} value={form.teacher.min_slots_needed} onChange={(event) => updateForm("teacher.min_slots_needed", Number(event.target.value))} /></Field>
                            <SlotSelector label="Creneaux preferes" selectedSlots={form.teacher.preferred_slots} onToggleSlot={(slot) => toggleSlot("teacher.preferred_slots", slot)} helperText="Ces creneaux augmentent la satisfaction de l'enseignant." />
                            <SlotSelector label="Creneaux indisponibles" selectedSlots={form.teacher.unavailable_slots} onToggleSlot={(slot) => toggleSlot("teacher.unavailable_slots", slot)} helperText="Ces creneaux seront evites pendant la negociation." />
                        </div>
                    )}

                    {formStep === 3 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Etudiants</h2>
                            <Field label="ID Groupe"><input className={inputClass} value={form.students.group_id} onChange={(event) => updateForm("students.group_id", event.target.value)} /></Field>
                            <SlotSelector label="Creneaux preferes" selectedSlots={form.students.preferred_slots} onToggleSlot={(slot) => toggleSlot("students.preferred_slots", slot)} helperText="Selectionnez les heures les plus confortables pour le groupe." />
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-700">Contraintes</h3>
                                <div className="mb-4 space-y-2">
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.students.constraints.no_early_morning} onChange={(event) => updateForm("students.constraints.no_early_morning", event.target.checked)} className="h-4 w-4" /><span className="text-sm text-gray-700">Pas de cours le matin</span></label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.students.constraints.no_late_afternoon} onChange={(event) => updateForm("students.constraints.no_late_afternoon", event.target.checked)} className="h-4 w-4" /><span className="text-sm text-gray-700">Pas de cours en fin d'apres-midi</span></label>
                                </div>
                                <Field label="Jours max par semaine"><input type="number" className={inputClass} value={form.students.constraints.max_days_per_week} onChange={(event) => updateForm("students.constraints.max_days_per_week", Number(event.target.value))} /></Field>
                                <p className="mb-2 text-sm font-semibold text-gray-700">Jours preferes</p>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day) => <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-lg px-3 py-1 text-sm font-semibold transition-colors ${form.students.constraints.preferred_days.includes(day) ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{day}</button>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {formStep === 4 && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">Creneaux calcules</h2>
                            <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <p className="text-sm font-semibold text-green-900">Les creneaux globaux sont construits automatiquement a partir des selections precedentes.</p>
                                {form.all_possible_slots.length > 0 ? <SelectionChips values={form.all_possible_slots} onRemove={(slot) => updateForm("all_possible_slots", form.all_possible_slots.filter((value) => value !== slot))} /> : <p className="mt-3 text-sm text-green-800">Aucun creneau disponible pour le moment.</p>}
                            </div>
                            <Field label="Creneau cible"><select className={inputClass} value={form.target_slot} onChange={(event) => updateForm("target_slot", event.target.value)}>{(form.all_possible_slots.length ? form.all_possible_slots : SLOT_OPTIONS).map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></Field>
                        </div>
                    )}
                </div>

                <div className="flex justify-between gap-3">
                    <button type="button" onClick={() => setFormStep(Math.max(0, formStep - 1))} disabled={formStep === 0} className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50">Precedent</button>
                    {formStep < 4 ? (
                        <button type="button" onClick={() => setFormStep(formStep + 1)} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">Suivant</button>
                    ) : (
                        <button type="button" onClick={handlePreview} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                            {loading && <Loader size={16} className="animate-spin" />}
                            {loading ? "Negociation en cours..." : "Lancer la negociation"}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
};

export default NegotiationOngoing;
