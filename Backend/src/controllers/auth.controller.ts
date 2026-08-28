import { Request, Response } from 'express';
import { authService } from '@services/Auth.service';

// Express 5: los errores de handlers async van solos al errorHandler global
// (ya no se necesita el wrapper asyncHandler de Express 4).
class AuthController {
  /**
   * Proxy para /api/usuario/hasaccess
   * Evita problemas de CORS al llamar al servicio de login desde el backend
   */
  async hasAccess(req: Request, res: Response) {
    const { id, sistema } = req.body;

    const headers = {
      Authorization: req.headers.authorization,
      Cookie: req.headers.cookie,
    };

    const result = await authService.hasAccess({ id, sistema }, headers);
    res.json(result);
  }

  /**
   * Proxy para /api/usuario/grupos
   * Obtiene los grupos/sistemas a los que pertenece un usuario
   */
  async getGrupos(req: Request, res: Response) {
    const headers = {
      Authorization: req.headers.authorization,
      Cookie: req.headers.cookie,
    };

    const result = await authService.getGrupos(headers);
    res.json(result);
  }
}

export const authController = new AuthController();
