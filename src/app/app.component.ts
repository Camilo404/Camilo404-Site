import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleAnimatorService } from './core/services/title-animator.service';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly titleAnimator = inject(TitleAnimatorService);

  ngOnInit(): void {
    this.titleAnimator.start();
  }

  ngOnDestroy(): void {
    this.titleAnimator.stop();
  }
}
