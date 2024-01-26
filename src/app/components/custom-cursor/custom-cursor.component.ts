import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-custom-cursor',
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.scss']
})
export class CustomCursorComponent implements OnInit {

  @ViewChild('ring') ring: any;

  constructor() { }

  ngOnInit(): void {
    document.addEventListener('mousemove', (e) => {
      this.ring.nativeElement.style.transform = `translate(calc(${e.clientX}px - 1rem), calc(${e.clientY}px - 1rem))`;
    });
  }
}
