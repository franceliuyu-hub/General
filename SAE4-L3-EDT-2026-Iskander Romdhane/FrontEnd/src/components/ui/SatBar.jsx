const SatBar = ({ val }) => {
    const c = val >= 85 ? "bg-green-500" : val >= 70 ? "bg-amber-400" : "bg-red-400";
    const t = val >= 85 ? "text-green-700" : val >= 70 ? "text-amber-600" : "text-red-600";
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c}`} style={{ width: `${val}%` }} />
            </div>
            <span className={`text-xs font-bold ${t}`}>{val}%</span>
        </div>
    );
};

export default SatBar;