const success = (res, data = null, message = 'success') => {
  res.json({ code: 0, message, data })
}

const error = (res, message = 'error', code = 500) => {
  res.status(code).json({ code, message })
}

const paginate = (res, list, total, page = 1, pageSize = 10) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  })
}

module.exports = { success, error, paginate }
