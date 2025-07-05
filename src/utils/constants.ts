/**
 * 📋 ملف الثوابت
 * تم إنشاؤه تلقائياً بواسطة Auto Fixer
 */

export const API_ENDPOINTS = {
  AUTH: 'http://localhost:3002/api/auth',
  COMPANIES: 'http://localhost:3002/api/companies',
  MESSAGES: 'http://localhost:3002/api/messages',
  FACEBOOK: 'http://localhost:3002/api/facebook',
  WHATSAPP: 'http://localhost:3002/api/whatsapp',
  GEMINI: 'http://localhost:3002/api/gemini'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio'
} as const;

export const PLATFORMS = {
  FACEBOOK: 'facebook',
  WHATSAPP: 'whatsapp'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  SUPER_ADMIN: 'super_admin'
} as const;

export default {
  API_ENDPOINTS,
  HTTP_STATUS,
  MESSAGE_TYPES,
  PLATFORMS,
  USER_ROLES
};