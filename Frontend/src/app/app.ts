import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  ToastContainerComponent,
  ConfirmDialogComponent,
  DevRibbonComponent,
  EnvBadgeComponent,
  VersionBadgeComponent,
  type EnvName,
} from '@hospital-carlos-cisterna-calama/ui';
import { environment } from '@environments/environment';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoadingComponent } from './shared/components/ui/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    ConfirmDialogComponent,
    DevRibbonComponent,
    EnvBadgeComponent,
    VersionBadgeComponent,
    HeaderComponent,
    FooterComponent,
    LoadingComponent,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /** Ambiente del build para hcc-env-badge ('prod' oculta el badge, igual que el local). */
  protected readonly env: EnvName = environment.production ? 'prod' : 'dev';

  /** Versión que muestra el badge DEV (antes el local leía environment.appVersion). */
  protected readonly version = environment.appVersion;
}
