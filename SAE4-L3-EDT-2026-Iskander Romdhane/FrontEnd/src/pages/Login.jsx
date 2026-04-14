import { useState } from "react";
import { BookOpen, LockKeyhole, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
    "w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm text-green-950 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const from = location.state?.from?.pathname || "/";

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        const result = await login(form);
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        navigate(from, { replace: true });
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.24),_transparent_35%),linear-gradient(135deg,_#f7fee7_0%,_#ffffff_48%,_#ecfdf5_100%)] px-4 py-10">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_30px_90px_rgba(20,83,45,0.12)]">
                <section className="hidden w-[46%] bg-green-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
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
                                Connectez-vous a votre espace de gestion.
                            </p>
                            <p className="mt-5 text-sm leading-7 text-green-100/85">
                                Retrouvez vos negociations, vos demandes et vos emplois du temps
                                dans la meme interface.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-green-300">
                            Authentification reelle
                        </p>
                        <div className="mt-4 space-y-2 text-sm text-green-50">
                            <p>Connectez-vous avec un compte cree depuis la page d'inscription.</p>
                        </div>
                    </div>
                </section>

                <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">
                                Connexion
                            </p>
                            <h1 className="mt-3 text-3xl font-extrabold text-green-950">
                                Bienvenue de retour
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Connectez-vous avec votre nom d'utilisateur et votre mot de passe.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                                    <UserRound size={16} className="text-green-600" />
                                    Nom d'utilisateur ou email
                                </span>
                                <input
                                    className={inputClass}
                                    value={form.identifier}
                                    onChange={(event) => handleChange("identifier", event.target.value)}
                                    placeholder="Votre nom d'utilisateur ou email"
                                    required
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
                                    placeholder="Votre mot de passe"
                                    required
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
                                {submitting ? "Connexion..." : "Se connecter"}
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-gray-500">
                            Vous n'avez pas encore de compte ?{" "}
                            <Link to="/signup" className="font-bold text-green-700 hover:text-green-800">
                                Creer un compte
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;
