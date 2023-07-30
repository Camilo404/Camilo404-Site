import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = document.title;
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
      if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 83 || e.keyCode === 123)) {
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
