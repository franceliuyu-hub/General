export const formatStatus = (status) => {
    const labels = {
        RESOLUE: "Resolue",
        FERMEE: "Fermee",
        EN_COURS: "En cours",
        OUVERTE: "Ouverte",
        VALIDE: "Valide",
        BROUILLON: "Brouillon",
        EN_NEGOCIATION: "En negociation",
    };

    return labels[status] || status || "-";
};

export const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatPercent = (value) => {
    if (value === null || value === undefined) {
        return "-";
    }

    return `${Math.round(value * 100)}%`;
};
