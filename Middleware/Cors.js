const allowedOrigins = [
    'https://cacolombia.com',
    'https://app.cacolombia.com',
    
];

module.exports = function validateOrigin(req, res, next) {
    const base_url =    process.env.BASE_URL
    if(!allowedOrigins.includes(base_url)){
        allowedOrigins.push(base_url)
    }
  const origin = req.get('Origin');
  const referer = req.get('Referer');

  let requestOrigin = '';

  if (origin) {
    requestOrigin = origin;
  } else if (referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch (error) {
      return res.status(403).json({ error: 'Forbbiden' });
    }
  }

  if (allowedOrigins.includes(requestOrigin)) {
    return next();
  }

  return res.status(403).json({ error: 'Forbbiden' });
};
