export function httpError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    },
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A record with the same unique value already exists',
        details: error.meta?.target,
      },
    });
  }

  const status = error.status || 500;
  const body = {
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: status === 500 ? 'An unexpected server error occurred' : error.message,
    },
  };

  if (error.details) {
    body.error.details = error.details;
  }

  res.status(status).json(body);
}
