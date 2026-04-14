import { useState } from "react";
import { CheckCircle, KeyRound, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
    "w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm text-green-950 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100";

const ChangePassword = () => {
    const { changePassword } = useAuth();
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (form.newPassword !== form.confirmPassword) {
            setError("La confirmation du nouveau mot de passe ne correspond pas.");
            return;
        }

        setSubmitting(true);
        const result = await changePassword({
            oldPassword: form.oldPassword,
            newPassword: form.newPassword,
        });
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setSuccess("Mot de passe mis a jour avec succes.");
    };

    return (
        <main className="flex-1 p-7">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <p className="text-sm font-bold uppercase tracking-[0.28em] text-green-600">
                        Securite
                    </p>
                    <h1 className="mt-3 text-3xl font-extrabold text-green-950">
                        Changer le mot de passe
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        Saisissez votre ancien mot de passe puis choisissez un nouveau mot de passe.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                            <KeyRound size={16} className="text-green-600" />
                            Ancien mot de passe
                        </span>
                        <input
                            type="password"
                            className={inputClass}
                            value={form.oldPassword}
                            onChange={(event) => handleChange("oldPassword", event.target.value)}
                            placeholder="Ancien mot de passe"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                            <ShieldAlert size={16} className="text-green-600" />
                            Nouveau mot de passe
                        </span>
                        <input
                            type="password"
                            className={inputClass}
                            value={form.newPassword}
                            onChange={(event) => handleChange("newPassword", event.target.value)}
                            placeholder="Nouveau mot de passe"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
                            <ShieldAlert size={16} className="text-green-600" />
                            Confirmer le nouveau mot de passe
                        </span>
                        <input
                            type="password"
                            className={inputClass}
                            value={form.confirmPassword}
                            onChange={(event) => handleChange("confirmPassword", event.target.value)}
                            placeholder="Confirmez le nouveau mot de passe"
                            required
                        />
                    </label>

                    {error && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
                    >
                        {submitting ? "Mise a jour..." : "Mettre a jour le mot de passe"}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default ChangePassword;
