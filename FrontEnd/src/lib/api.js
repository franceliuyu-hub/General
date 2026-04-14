const API_BASE_URL = "http://localhost:8080/api";

const parseErrorMessage = async (response, fallbackMessage) => {
    try {
        const data = await response.json();
        return data.message || data.error || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
};

export const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Une erreur est survenue."));
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const startNegotiationPreview = (payload) =>
    apiRequest("/negotiate/start", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const saveNegotiation = (userId, payload) =>
    apiRequest(`/users/${userId}/negotiations`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const getUserNegotiations = (userId) => apiRequest(`/users/${userId}/negotiations`);

export const getNegotiationDetails = (userId, negotiationId) =>
    apiRequest(`/users/${userId}/negotiations/${negotiationId}`);

export const deleteNegotiation = (userId, negotiationId) =>
    apiRequest(`/users/${userId}/negotiations/${negotiationId}`, {
        method: "DELETE",
    });

export const getUserEmplois = (userId) => apiRequest(`/users/${userId}/emplois`);
