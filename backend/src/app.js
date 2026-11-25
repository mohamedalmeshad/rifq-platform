import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { NotFoundError } from './common/errors/NotFoundError.js';
import { sendSuccess, sendError } from './common/utils/response.js';
import { errorHandler } from './common/middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this client. Please try again later.',
    }),
});

app.use('/api/v1', apiRateLimiter);

app.get('/api/v1/health', (_req, res) =>
  sendSuccess(res, {
    statusCode: 200,
    message: 'Rifq Platform API is healthy',
    data: {
      status: 'UP',
      version: '1.6.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  })
);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/auth', authRoutes);

app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`, 'RESOURCE_NOT_FOUND'));
});

app.use(errorHandler);

export default app;
