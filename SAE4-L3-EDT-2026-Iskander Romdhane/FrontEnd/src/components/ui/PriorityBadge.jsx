const PriorityBadge = ({ p }) => {
    const map = {
        Haute: "bg-red-50 text-red-500 border-red-200",
        Critique: "bg-red-100 text-red-700 border-red-300",
        Moyenne: "bg-amber-50 text-amber-600 border-amber-200",
        Basse: "bg-green-50 text-green-600 border-green-200",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${map[p] || "bg-gray-100 text-gray-500"}`}>
      {p}
    </span>
    );
};

export default PriorityBadge;