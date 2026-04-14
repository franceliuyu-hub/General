import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

const SESSION_KEY = "scheduler-transformer-session-user-id";

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const persistSession = (user) => {
        localStorage.setItem(SESSION_KEY, String(user.id));
        setCurrentUser(user);
    };

    const clearSession = () => {
        localStorage.removeItem(SESSION_KEY);
        setCurrentUser(null);
    };

    const refreshProfile = async () => {
        const storedUserId = localStorage.getItem(SESSION_KEY);

        if (!storedUserId) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const profile = await apiRequest(`/users/${storedUserId}/profile`);
            setCurrentUser(profile);
        } catch {
            clearSession();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    const login = async ({ identifier, password }) => {
        try {
            const user = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({ identifier, password }),
            });
            persistSession(user);
            return { ok: true };
        } catch (error) {
            return { ok: false, message: error.message };
        }
    };

    const signup = async (payload) => {
        try {
            const user = await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            persistSession(user);
            return { ok: true };
        } catch (error) {
            return { ok: false, message: error.message };
        }
    };

    const updateProfile = async (updates) => {
        if (!currentUser) {
            return { ok: false, message: "Aucun utilisateur connecte." };
        }

        try {
            const user = await apiRequest(`/users/${currentUser.id}/profile`, {
                method: "PUT",
                body: JSON.stringify(updates),
            });
            setCurrentUser(user);
            return { ok: true, user };
        } catch (error) {
            return { ok: false, message: error.message };
        }
    };

    const changePassword = async ({ oldPassword, newPassword }) => {
        if (!currentUser) {
            return { ok: false, message: "Aucun utilisateur connecte." };
        }

        try {
            await apiRequest(`/users/${currentUser.id}/change-password`, {
                method: "PUT",
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            return { ok: true };
        } catch (error) {
            return { ok: false, message: error.message };
        }
    };

    const logout = () => {
        clearSession();
    };

    const value = useMemo(
        () => ({
            currentUser,
            isAuthenticated: Boolean(currentUser),
            isLoading,
            login,
            signup,
            logout,
            refreshProfile,
            updateProfile,
            changePassword,
        }),
        [currentUser, isLoading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return context;
};
