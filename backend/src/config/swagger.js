import { env } from './env.js';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Rifq Platform REST API',
    version: '1.6.0',
    description:
      'Modular Monolith REST API for Quranic & Islamic Studies Academy Management (v1.6). Aligned with docs/03_api_contract/api_contract_v1.6.md.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api/v1`,
      description: 'Local Development Server',
    },
    {
      url: 'https://api.rifq.app/api/v1',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Request validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    issue: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        responses: {
          200: {
            description: 'Service is healthy',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user and issue 8-hour JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  fcmToken: { type: 'string' },
                  platform: { type: 'string', enum: ['WEB', 'ANDROID', 'IOS'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
          403: { description: 'Account locked or inactive' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Blacklist active JWT and optionally remove FCM token',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/fcm-token': {
      post: {
        tags: ['Auth'],
        summary: 'Register or refresh device FCM token',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'FCM token registered' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Retrieve current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};

export default swaggerSpec;
