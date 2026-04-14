import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";

const Layout = () => {
    const [open, setOpen] = useState(true);

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar open={open} setOpen={setOpen} />
            <div
                className={`${
                    open ? "ml-56" : "ml-16"
                } flex-1 flex flex-col transition-all duration-300 min-w-0`}
            >
                <Topbar />
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;