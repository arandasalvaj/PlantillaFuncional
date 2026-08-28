import { Injectable, signal, computed } from '@angular/core';

/**
 * Global loading state service using signals.
 * Use this to show/hide loading indicators across the app.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _loadingCount = signal(0);

  readonly isLoading = computed(() => this._loadingCount() > 0);

  start(): void {
    this._loadingCount.update(count => count + 1);
  }

  stop(): void {
    this._loadingCount.update(count => Math.max(0, count - 1));
  }

  reset(): void {
    this._loadingCount.set(0);
  }
}
