const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Solución para ignorar errores de archivos anónimos
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Ignorar solicitudes a archivos anónimos
      if (req.url.includes('<anonymous>') || 
          req.url.includes('undefined') ||
          req.url.includes('null')) {
        console.log('✅ Ignorando solicitud de archivo anónimo');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end('{}');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;