import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './not-found-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {
  readonly visible = signal(false);

  constructor() {
    setTimeout(() => this.visible.set(true), 30);
  }
}
