import { useState } from "react";
import { BookOpen, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
    "w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm text-green-950 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100";

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: "",
        prenom: "",
        nom: "",
        email: "",
        password: "",
        telephone: "",
        departement: "",
        ville: "",
        bio: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        const result = await signup(form);
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        navigate("/", { replace: true });
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_rgba(74,222,128,0.22),_transparent_32%),linear-gradient(160deg,_#f0fdf4_0%,_#ffffff_52%,_#ecfeff_100%)] px-4 py-10">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_30px_90px_rgba(20,83,45,0.12)]">
                <section className="hidden w-[44%] bg-green-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-400">
                                <BookOpen size={22} className="text-green-950" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold">Scheduling</p>
                                <p className="text-xs font-bold uppercase tracking-[0.35em] text-green-300">
                                    Transformer
                                </p>
                            </div>
                        </div>
                        <div className="mt-14 max-w-sm">
                            <p className="text-4xl font-extrabold leading-tight">
                                Creez votre acces en quelques secondes.
                            </p>
                            <p className="mt-5 text-sm leading-7 text-green-100/85">
                                Votre compte sera pret pour vous connecter et acceder directement a
                                l'application.
                            </p>
                        </div>
                    </div>


                </section>

                <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
                    <div className="w-full max-w-lg">
                        <div className="mb-8">
                            <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">
                                Inscription
                            </p>
                            <h1 className="mt-3 text-3xl font-extrabold text-green-950">
                                Creer un nouveau compte
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Renseignez votre identite puis choisissez un mot de passe.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                                    <UserRound size={16} className="text-green-600" />
                                    Nom d'utilisateur
                                </span>
                                <input
                                    className={inputClass}
                                    value={form.username}
                                    onChange={(event) => handleChange("username", event.target.value)}
                                    placeholder="Choisissez un nom d'utilisateur"
                                    required
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 text-sm font-semibold text-green-900">
                                        Prenom
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={form.prenom}
                                        onChange={(event) => handleChange("prenom", event.target.value)}
                                        placeholder="Votre prenom"
                                        required
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 text-sm font-semibold text-green-900">
                                        Nom
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={form.nom}
                                        onChange={(event) => handleChange("nom", event.target.value)}
                                        placeholder="Votre nom"
                                        required
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                                    <Mail size={16} className="text-green-600" />
                                    Email
                                </span>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={form.email}
                                    onChange={(event) => handleChange("email", event.target.value)}
                                    placeholder="vous@exemple.com"
                                    required
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 text-sm font-semibold text-green-900">
                                        Telephone
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={form.telephone}
                                        onChange={(event) => handleChange("telephone", event.target.value)}
                                        placeholder="+33 6 00 00 00 00"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 text-sm font-semibold text-green-900">
                                        Departement
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={form.departement}
                                        onChange={(event) => handleChange("departement", event.target.value)}
                                        placeholder="Gestion des salles"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="mb-2 text-sm font-semibold text-green-900">
                                    Ville
                                </span>
                                <input
                                    className={inputClass}
                                    value={form.ville}
                                    onChange={(event) => handleChange("ville", event.target.value)}
                                    placeholder="Paris, France"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                                    <LockKeyhole size={16} className="text-green-600" />
                                    Mot de passe
                                </span>
                                <input
                                    type="password"
                                    className={inputClass}
                                    value={form.password}
                                    onChange={(event) => handleChange("password", event.target.value)}
                                    placeholder="Choisissez un mot de passe"
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 text-sm font-semibold text-green-900">
                                    Biographie
                                </span>
                                <textarea
                                    className={`${inputClass} min-h-24 resize-none`}
                                    value={form.bio}
                                    onChange={(event) => handleChange("bio", event.target.value)}
                                    placeholder="Parlez un peu de vous"
                                />
                            </label>

                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
                            >
                                {submitting ? "Creation..." : "Creer mon compte"}
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-gray-500">
                            Vous avez deja un compte ?{" "}
                            <Link to="/login" className="font-bold text-green-700 hover:text-green-800">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Signup;
