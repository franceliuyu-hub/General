const ConfirmDialog = ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-green-950/45 px-4">
            <div className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-6 shadow-2xl">
                <div className="mb-5">
                    <p className="text-lg font-extrabold text-green-950">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-800"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

ConfirmDialog.defaultProps = {
    confirmLabel: "Confirmer",
    cancelLabel: "Annuler",
};

export default ConfirmDialog;
