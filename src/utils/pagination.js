function parsePagination(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100); // max 100 biar aman
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

function buildPagination({ page, limit, totalItems }) {
    const totalPages = Math.max(Math.ceil(totalItems / limit) || 1, 1);
    return {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
    };
}

module.exports = { 
    parsePagination, 
    buildPagination 
};
