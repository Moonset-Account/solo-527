const { error } = require('../utils/response');

function validate(schema) {
  return (req, res, next) => {
    const { body, params, query } = req;
    const data = { ...body, ...params, ...query };

    if (!schema) {
      return next();
    }

    const errors = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`${field} 为必填项`);
        }
      }
    }

    if (errors.length > 0) {
      return error(res, errors.join(', '), 400);
    }

    next();
  };
}

module.exports = {
  validate,
};
