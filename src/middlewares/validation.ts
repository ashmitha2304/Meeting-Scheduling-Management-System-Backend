import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

/**
 * Validation Middleware Factory
 * 
 * Creates middleware that validates request data against Joi schemas
 * Supports validation of body, params, and query
 */

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Generic validation middleware
 * 
 * @param schema - Joi schema to validate against
 * @param target - Which part of request to validate (body, params, query)
 * @returns Express middleware function
 * 
 * Usage:
 * router.post('/meetings', validate(createMeetingSchema, 'body'), controller)
 */
export const validate = (schema: Schema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types (e.g., string to number)
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
      return;
    }

    // Replace request data with validated/sanitized data
    req[target] = value;

    next();
  };
};

/**
 * Validate request body
 * 
 * Shorthand for validate(schema, 'body')
 * 
 * Usage:
 * router.post('/meetings', validateBody(createMeetingSchema), controller)
 */
export const validateBody = (schema: Schema) => validate(schema, 'body');

/**
 * Validate request params
 * 
 * Usage:
 * router.get('/meetings/:id', validateParams(mongoIdSchema), controller)
 */
export const validateParams = (schema: Schema) => validate(schema, 'params');

/**
 * Validate request query
 * 
 * Usage:
 * router.get('/meetings', validateQuery(getMeetingsQuerySchema), controller)
 */
export const validateQuery = (schema: Schema) => validate(schema, 'query');

/**
 * Validate multiple parts of request simultaneously
 * 
 * @param validations - Object with schemas for different request parts
 * @returns Express middleware function
 * 
 * Usage:
 * router.put('/meetings/:id', validateMultiple({
 *   params: mongoIdSchema,
 *   body: updateMeetingSchema
 * }), controller)
 */
export const validateMultiple = (validations: {
  body?: Schema;
  params?: Schema;
  query?: Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate each specified part
    Object.entries(validations).forEach(([target, schema]) => {
      const dataToValidate = req[target as ValidationTarget];

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            field: `${target}.${detail.path.join('.')}`,
            message: detail.message,
          });
        });
      } else {
        // Replace with validated data
        req[target as ValidationTarget] = value;
      }
    });

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};
