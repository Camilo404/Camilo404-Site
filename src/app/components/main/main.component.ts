import { Component, OnInit, ViewChild, Renderer2, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, AfterViewInit {

  public isMuted: boolean = true;

  @ViewChild('bgVideo') bgVideo: any;
  @ViewChild('iconVolume') iconVolume: any;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.bgVideo.nativeElement.muted = this.isMuted;
  }

  public toggleMute(): void {
    if (this.bgVideo) {
      this.isMuted = !this.isMuted;
      this.bgVideo.nativeElement.muted = this.isMuted;

      if (this.iconVolume) {
        if (this.isMuted) {
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bxs-volume-full');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bxs-volume-mute');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bx-tada');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bx-flip-vertical');
        } else {
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bxs-volume-mute');
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bx-tada');
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bx-flip-vertical');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bxs-volume-full');
        }
      }
    }
  }
}
