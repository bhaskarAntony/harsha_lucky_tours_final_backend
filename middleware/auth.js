import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback to cookies (if using cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // Use environment variable for JWT secret (NEVER hardcode in production)
    const decoded = jwt.verify(token,"dndyduduihuidhuiwi");
    
    // Find user without password
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Error:', error.name, error.message);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again'
      });
    }

    // Generic JWT verification error
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Enhanced authorize middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Handle role as string or object
    const userRole = req.user.role;
    const userRoles = Array.isArray(userRole) ? userRole : [userRole];

    // Check if any of user's roles match required roles
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `User role(s) ${userRoles.join(', ')} not authorized for this route. Required: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};