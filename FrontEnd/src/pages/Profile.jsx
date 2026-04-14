import { useEffect, useState } from "react";
import {
    CheckCircle,
    Edit3,
    Mail,
    MapPin,
    Phone,
    Save,
    Shield,
    User,
    Building2,
    KeyRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
    username: "",
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    departement: "",
    ville: "",
    bio: "",
};

const Profile = () => {
    const navigate = useNavigate();
    const { currentUser, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        setForm({
            username: currentUser.username || "",
            email: currentUser.email || "",
            nom: currentUser.nom || "",
            prenom: currentUser.prenom || "",
            telephone: currentUser.telephone || "",
            departement: currentUser.departement || "",
            ville: currentUser.ville || "",
            bio: currentUser.bio || "",
        });
    }, [currentUser]);

    const handleSave = async () => {
        setError("");
        setSaved(false);
        setSubmitting(true);
        const result = await updateProfile(form);
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleCancel = () => {
        setEditing(false);
        setError("");
        setSaved(false);
        if (!currentUser) {
            return;
        }
        setForm({
            username: currentUser.username || "",
            email: currentUser.email || "",
            nom: currentUser.nom || "",
            prenom: currentUser.prenom || "",
            telephone: currentUser.telephone || "",
            departement: currentUser.departement || "",
            ville: currentUser.ville || "",
            bio: currentUser.bio || "",
        });
    };

    const inp =
        "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400";
    const ro =
        "w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700";

    const fullName = `${form.prenom} ${form.nom}`.trim();
    const roleLabel =
        currentUser?.role === "ROOM_MANAGER" ? "Room Manager" : currentUser?.role || "Utilisateur";

    const contactItems = [
        { icon: Mail, value: form.email || "Email non renseigne" },
        { icon: Phone, value: form.telephone || "Telephone non renseigne" },
        { icon: MapPin, value: form.ville || "Ville non renseignee" },
        { icon: Building2, value: form.departement || "Departement non renseigne" },
    ];

    return (
        <main className="flex-1 p-7">
            {saved && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                    <CheckCircle size={16} className="text-green-600" /> Profil mis a jour avec succes
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-green-600 shadow-md">
                            <User size={44} className="text-white" />
                        </div>
                        <h2 className="text-base font-extrabold text-green-900">
                            {fullName || "Utilisateur"}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">{roleLabel}</p>
                        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1">
                            <Shield size={12} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">@{form.username}</span>
                        </div>
                        <div className="mt-4 w-full space-y-2 border-t border-gray-100 pt-4 text-left">
                            {contactItems.map(({ icon: Icon, value }) => (
                                <div key={value} className="flex items-center gap-2 text-xs text-gray-500">
                                    <Icon size={13} className="shrink-0 text-green-500" />
                                    <span className="truncate">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/mot-de-passe")}
                        className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white p-5 text-left shadow-sm transition-colors hover:bg-green-50"
                    >
                        <div className="rounded-xl bg-green-100 p-3 text-green-700">
                            <KeyRound size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-900">Changer le mot de passe</p>
                            <p className="mt-1 text-xs text-gray-500">
                                Verifiez votre ancien mot de passe avant de le remplacer.
                            </p>
                        </div>
                    </button>
                </div>

                <div className="xl:col-span-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-green-900">Informations personnelles</h3>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    Gerez vos informations de compte
                                </p>
                            </div>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
                                >
                                    <Edit3 size={13} /> Modifier
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={submitting}
                                        className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
                                    >
                                        <Save size={13} />
                                        {submitting ? "Sauvegarde..." : "Sauvegarder"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                { label: "Prenom", key: "prenom" },
                                { label: "Nom", key: "nom" },
                                { label: "Nom d'utilisateur", key: "username" },
                                { label: "Email", key: "email", type: "email" },
                                { label: "Telephone", key: "telephone" },
                                { label: "Departement", key: "departement" },
                                { label: "Ville", key: "ville" },
                            ].map(({ label, key, type = "text" }) => (
                                <div key={key}>
                                    <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
                                    {editing ? (
                                        <input
                                            type={type}
                                            className={inp}
                                            value={form[key]}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, [key]: event.target.value }))
                                            }
                                        />
                                    ) : (
                                        <div className={ro}>{form[key] || "-"}</div>
                                    )}
                                </div>
                            ))}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-500">Biographie</label>
                                {editing ? (
                                    <textarea
                                        className={`${inp} h-28 resize-none`}
                                        value={form.bio}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, bio: event.target.value }))
                                        }
                                    />
                                ) : (
                                    <div className={`${ro} min-h-28 leading-relaxed`}>
                                        {form.bio || "Aucune biographie renseignee."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Profile;
