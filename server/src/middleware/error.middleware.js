const AppError = require('../utils/app-error');

function notFoundHandler(req, res, next) {
  next(new AppError(404, 'Route introuvable.'));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || 500;
  const isKnownPrismaConflict = error.code === 'P2002';

  if (isKnownPrismaConflict) {
    res.status(409).json({
      message: 'Une valeur unique existe deja.',
      details: error.meta || null,
    });
    return;
  }

  res.status(statusCode).json({
    message: error.message || 'Une erreur serveur est survenue.',
    details: error.details || null,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
