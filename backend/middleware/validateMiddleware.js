const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!result.success) {
        const message = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        return res.status(400).json({ message: message || 'Invalid request payload' });
    }

    req.body = result.data.body ?? req.body;
    req.validated = {
        query: result.data.query ?? req.query,
        params: result.data.params ?? req.params,
    };
    next();
};

module.exports = validate;
