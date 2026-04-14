const ProgressBar = ({ pct, statut }) => {
    const c =
        statut === "Blocage"
            ? "bg-red-400"
            : statut === "Accord proche"
                ? "bg-emerald-400"
                : pct === 100
                    ? "bg-blue-400"
                    : "bg-green-600";
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400">{pct}%</span>
        </div>
    );
};

export default ProgressBar;