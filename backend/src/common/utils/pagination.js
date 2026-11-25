export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const parsePagination = (query = {}) => {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const rawLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT;
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;
  const sort = typeof query.sort === 'string' && query.sort.trim().length > 0
    ? query.sort.trim()
    : '-createdAt';

  return { page, limit, skip, sort };
};

export const buildPaginationMeta = ({ page, limit, totalItems }) => ({
  page,
  limit,
  totalItems,
  totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
});
