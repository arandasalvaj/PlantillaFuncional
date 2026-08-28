import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '@environments/environment';
import { LOGIN_URL } from '@core/entorno';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  templateUrl: './unauthorized-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedPageComponent {
  readonly redirectUrl = LOGIN_URL;
  countdown = signal(15);
  visible = signal(false);
  private intervalId: any;

  constructor(){
    // delay para animación
    setTimeout(()=> this.visible.set(true), 30);
    this.intervalId = setInterval(()=> {
      const v = this.countdown();
      if(v <= 1){
        clearInterval(this.intervalId);
        window.location.href = this.redirectUrl;
      } else {
        this.countdown.set(v - 1);
      }
    }, 1000);
  }

  reload(){ window.location.reload(); }
}
