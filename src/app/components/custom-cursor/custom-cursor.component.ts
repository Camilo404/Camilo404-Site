import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-custom-cursor',
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.scss']
})
export class CustomCursorComponent implements OnInit, AfterViewInit {

  @ViewChild('ring') ring: any;

  constructor() { }

  ngOnInit(): void {
    document.addEventListener('mousemove', (e) => {
      this.ring.nativeElement.style.transform = `translate(calc(${e.clientX}px - 1rem), calc(${e.clientY}px - 1rem))`;
    });
  }

  ngAfterViewInit(): void {
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) {
        this.ring.nativeElement.style.display = 'none';
      }
    });

    document.addEventListener('mouseover', () => {
      this.ring.nativeElement.style.display = 'block';
    });

    document.querySelectorAll('.hovered').forEach((el) => {
      el.addEventListener('mouseover', () => {
        this.ring.nativeElement.classList.add('hover');
      });
      el.addEventListener('mouseout', () => {
        this.ring.nativeElement.classList.remove('hover');
      });
    });
  }
}
