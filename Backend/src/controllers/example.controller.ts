/**
 * Controller para Example — solo manejo de req/res.
 * La lógica de negocio va en el Service.
 *
 * Express 5: si un handler async lanza (o rechaza), el error viaja SOLO
 * al errorHandler global — no hace falta try/catch ni next(err) en cada
 * método (eso era boilerplate obligatorio de Express 4).
 *
 * Convención:  example.controller.ts  (kebab-case)
 */
import { Request, Response } from 'express';
import { ExampleService } from '../services/example.service';

export class ExampleController {
  static async getAll(_req: Request, res: Response) {
    res.json(await ExampleService.getAll());
  }

  static async getById(req: Request, res: Response) {
    res.json(await ExampleService.getById(Number(req.params.id)));
  }

  static async create(req: Request, res: Response) {
    res.status(201).json(await ExampleService.create(req.body));
  }

  static async update(req: Request, res: Response) {
    res.json(await ExampleService.update(Number(req.params.id), req.body));
  }

  static async delete(req: Request, res: Response) {
    res.json(await ExampleService.delete(Number(req.params.id)));
  }
}
