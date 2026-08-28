// validateToken.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Fail-fast: sin JWT_SECRET el sistema NO debe validar tokens.
// Jamás un secreto por defecto — eso es un fail-open silencioso.
function requireJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET no configurado — abortando validación de token');
  return s;
}

// Extendemos la interfaz Request para incluir la propiedad userId
declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
    }
  }
}

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ message: 'Formato de token inválido' });
    return;
  }

  const token = parts[1];

  try {
    // algorithms fijado: ApiLogin firma HS256. Sin esto, jwt.verify acepta
    // cualquier HMAC — fijarlo cierra la clase de ataques de confusión de algoritmo.
    const decoded = jwt.verify(token, requireJwtSecret(), { algorithms: ['HS256'] });
    // Se asume que el token contiene el id del usuario en la propiedad "sub"
    req.userId = (decoded as any).sub;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'El token ha expirado' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    return;
  }
};
