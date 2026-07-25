import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'C a m i l o 4 0 4';
  animSeq = ["/", "$", "\\", "|", "$"];
  animIndex = signal(0);
  titleIndex = signal(0);

  private titleTimer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = () => this.syncTitleTimer();

  constructor() { }

  ngOnInit(): void {
    this.doInverseSpinZeroPitch();
    this.syncTitleTimer();
    document.addEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  ngOnDestroy(): void {
    this.stopTitleTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  private syncTitleTimer(): void {
    if (document.hidden) {
      this.stopTitleTimer();
    } else if (!this.titleTimer) {
      this.titleTimer = setInterval(() => this.doInverseSpinZeroPitch(), 250);
    }
  }

  private stopTitleTimer(): void {
    if (this.titleTimer) {
      clearInterval(this.titleTimer);
      this.titleTimer = undefined;
    }
  }

  doInverseSpinZeroPitch() {
    const titleIdx = this.titleIndex();
    const animIdx = this.animIndex();
    const loadTitle = this.title.substring(0, titleIdx);
    
    if (titleIdx > this.title.length) {
      this.animIndex.set(0);
      this.titleIndex.set(0);
    }
    if (animIdx > 3) {
      this.titleIndex.update(i => i + 1);
      this.animIndex.set(0);
    }
    document.title = loadTitle + this.animSeq[this.animIndex()];
    this.animIndex.update(i => i + 1);
  }
}
