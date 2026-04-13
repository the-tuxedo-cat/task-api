import { query } from 'express-validator';
import { checkValidationResults } from './handleValidationErrors.js';

export const validateTaskQuery = [
  query('completed')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('completed must be true or false'),

  checkValidationResults,
];
