const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key'); // Use environment variable instead of hardcoding
        // req.user = decoded;
        // next();

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
              return res.status(403).send('Invalid Tokens'); // Token verification failed
            }
            req.user = user;
            next();
        });

    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};


module.exports = authenticateToken;
