import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../../core/services/loading.service';

/**
 * Global loading spinner overlay component.
 * Place this in the root app component template.
 *
 * Usage: <app-loading />
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
})
export class LoadingComponent {
  protected readonly loadingService = inject(LoadingService);
}
