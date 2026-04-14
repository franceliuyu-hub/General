const IconBtn = ({ icon: Icon, cls = "text-green-700 border-green-200 hover:bg-green-50" }) => (
    <button className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${cls}`}>
        <Icon size={13} />
    </button>
);

export default IconBtn;