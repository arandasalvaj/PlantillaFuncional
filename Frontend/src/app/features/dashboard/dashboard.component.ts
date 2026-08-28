import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { StatCardComponent } from '@hospital-carlos-cisterna-calama/ui';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideDynamicIcon, StatCardComponent],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  readonly userName = computed(() => {
    const access = this.authService.accessData();
    return access?.nombre_completo || access?.username || 'Usuario';
  });
}
