/**
 * Standardized API response helpers aligned with docs/03_api_contract/api_contract_v1.6.md.
 */

export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = 'Operation completed successfully',
    data = null,
    pagination = undefined,
  } = {}
) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (
  res,
  {
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    message = 'An unexpected error occurred',
    details = undefined,
    meta = undefined,
  } = {}
) => {
  const errorPayload = {
    code,
    message,
  };

  if (Array.isArray(details) && details.length > 0) {
    errorPayload.details = details;
  }

  if (meta && typeof meta === 'object') {
    Object.assign(errorPayload, meta);
  }

  return res.status(statusCode).json({
    success: false,
    error: errorPayload,
  });
};
