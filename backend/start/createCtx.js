export function createCtx(req, res) {
  const request = {
    qs: () => req.query,
    all: () => ({ ...req.query, ...req.body }),
    input: (key, defaultValue = undefined) => {
      if (req.body && req.body[key] !== undefined) {
        return req.body[key]
      }
      if (req.query && req.query[key] !== undefined) {
        return req.query[key]
      }
      return defaultValue
    },
    header: (name) => req.headers[name.toLowerCase()],
  }

  const response = {
    status: (code) => {
      res.status(code)
      return response
    },
    json: (data) => res.json(data),
    send: (data) => res.send(data),
  }

  const params = req.params || {}

  const auth = {
    user: req.user || null,
  }

  return {
    request,
    response,
    params,
    auth,
  }
}

export default createCtx
