import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  title = 'C a m i l o 4 0 4';
  animSeq = ["/", "$", "\\", "|", "$"];
  animIndex = signal(0);
  titleIndex = signal(0);

  constructor() { }

  ngOnInit(): void {
    this.doInverseSpinZeroPitch();
    setInterval(() => { this.doInverseSpinZeroPitch(); }, 100);

    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    }, false);
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && (e.code === 'KeyU' || e.code === 'KeyI' || e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyS' || e.code === 'F12')) {
        e.preventDefault();
      }
    }, false);
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
