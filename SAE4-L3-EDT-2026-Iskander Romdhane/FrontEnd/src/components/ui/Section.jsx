import { ChevronUp, ChevronDown } from "lucide-react";

const Section = ({ title, icon: Icon, expanded, onToggle, action, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Icon size={16} className="text-green-700" />
                </div>
                <span className="font-bold text-sm text-green-900">{title}</span>
            </div>
            <div className="flex items-center gap-4">
                {action && <span className="text-xs text-green-700 font-semibold underline">{action}</span>}
                {expanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                )}
            </div>
        </div>
        {expanded && <div className="overflow-x-auto">{children}</div>}
    </div>
);

export default Section;