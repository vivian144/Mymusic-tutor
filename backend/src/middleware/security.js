const helmet = require('helmet');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'none'"],
      scriptSrc:   ["'none'"],
      styleSrc:    ["'none'"],
      imgSrc:      ["'none'"],
      connectSrc:  ["'none'"],
      fontSrc:     ["'none'"],
      objectSrc:   ["'none'"],
      mediaSrc:    ["'none'"],
      frameSrc:    ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl:        { allow: false },
  frameguard:                { action: 'deny' },
  hidePoweredBy:             true,
  hsts:                      { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen:                  true,
  noSniff:                   true,
  originAgentCluster:        true,
  permittedCrossDomainPolicies: false,
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
  xssFilter:                 true
});

module.exports = { securityHeaders };
