export const Th = ({ c }) => (
    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100">
        {c}
    </th>
);

export const Td = ({ children, cls = "" }) => (
    <td className={`px-4 py-3 ${cls}`}>{children}</td>
);