/**
 * SERVICE de feature — habla con el backend y DEVUELVE SIEMPRE el modelo de
 * dominio, nunca el DTO. El mapeo se hace acá, en la frontera; los componentes
 * reciben datos ya limpios y tipados.
 *
 * Patrón: HttpClient tipado al DTO → `map` al modelo con el mapper. Es la
 * ÚNICA capa que toca `ExampleDto`.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import type { Example } from './example.model';
import type { ExampleDto } from './example.dto';
import { toExample, toExampleDto } from './example.mapper';

@Injectable({ providedIn: 'root' })
export class ExampleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/example`;

  /** Lista: DTO[] del backend → Example[] de dominio (map en la frontera). */
  listar() {
    return this.http.get<ExampleDto[]>(this.url).pipe(map(dtos => dtos.map(toExample)));
  }

  obtener(id: number) {
    return this.http.get<ExampleDto>(`${this.url}/${id}`).pipe(map(toExample));
  }

  crear(model: Partial<Example>) {
    return this.http.post<ExampleDto>(this.url, toExampleDto(model)).pipe(map(toExample));
  }

  actualizar(id: number, model: Partial<Example>) {
    return this.http.put<ExampleDto>(`${this.url}/${id}`, toExampleDto(model)).pipe(map(toExample));
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
