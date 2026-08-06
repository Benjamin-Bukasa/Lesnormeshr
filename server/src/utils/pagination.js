const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallbackValue) {
  const normalized = Number.parseInt(value, 10);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return fallbackValue;
  }

  return normalized;
}

function parsePagination(query = {}, options = {}) {
  const defaultPage = options.defaultPage || DEFAULT_PAGE;
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;

  const page = parsePositiveInt(query.page, defaultPage);
  const requestedLimit = parsePositiveInt(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

function buildPagination(page, limit, totalItems) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: totalPages > 0 && page < totalPages,
  };
}

module.exports = {
  buildPagination,
  parsePagination,
};
