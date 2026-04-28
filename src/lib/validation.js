import { httpError } from './errors.js';

export const PROJECT_STATUSES = ['active', 'archived'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'];

export function positiveInt(value, name = 'id') {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw httpError(400, 'BAD_REQUEST', `${name} must be a positive integer`);
  }
  return parsed;
}

export function requiredString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, 'BAD_REQUEST', `${name} is required`);
  }
  return value.trim();
}

export function optionalString(value, name) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw httpError(400, 'BAD_REQUEST', `${name} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function enumValue(value, allowed, name, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue === undefined ? undefined : defaultValue.toUpperCase();
  }

  if (typeof value !== 'string') {
    throw httpError(400, 'BAD_REQUEST', `${name} must be one of: ${allowed.join(', ')}`);
  }

  const normalized = value.toLowerCase();
  if (!allowed.includes(normalized)) {
    throw httpError(400, 'BAD_REQUEST', `${name} must be one of: ${allowed.join(', ')}`);
  }
  return normalized.toUpperCase();
}

export function optionalDate(value, name = 'dueDate') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw httpError(400, 'BAD_REQUEST', `${name} must be a date string`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, 'BAD_REQUEST', `${name} must be a valid date in YYYY-MM-DD format`);
  }
  return date;
}

export function validateEmail(email) {
  const value = requiredString(email, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw httpError(400, 'BAD_REQUEST', 'email must be a valid email address');
  }
  return value;
}

export function validatePassword(password) {
  const value = requiredString(password, 'password');
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value)) {
    throw httpError(
      400,
      'BAD_REQUEST',
      'password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
    );
  }
  return value;
}
