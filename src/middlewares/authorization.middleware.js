async function hasToken (req, res, next) {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if(!token) {
        return res.sendStatus(401);
    }

    next();
}

export default hasToken;