import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  title = 'C a m i l o 4 0 4';
  animSeq = ["/", "$", "\\", "|", "$"];
  animIndex = 0;
  titleIndex = 0;

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
    const loadTitle = this.title.substring(0, this.titleIndex);
    if (this.titleIndex > this.title.length) {
      this.animIndex = 0;
      this.titleIndex = 0;
    }
    if (this.animIndex > 3) {
      this.titleIndex++;
      this.animIndex = 0;
    }
    document.title = loadTitle + this.animSeq[this.animIndex];
    this.animIndex++;
  }
}
