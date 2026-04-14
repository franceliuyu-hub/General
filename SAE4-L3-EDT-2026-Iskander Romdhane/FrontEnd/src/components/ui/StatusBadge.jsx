import { statusStyles } from "../../styles/statusStyles";

const StatusBadge = ({ status }) => {
    const s = statusStyles[status] || { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status}
    </span>
    );
};

export default StatusBadge;