import { Component, ViewChild, Renderer2, AfterViewInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements AfterViewInit {

  public isMuted: boolean = true;

  @ViewChild('bgVideo') bgVideo!: ElementRef;
  @ViewChild('iconVolume') iconVolume!: ElementRef;
  @ViewChild('volumeInput') volumeInput!: ElementRef;

  public volume: number = 0;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    this.bgVideo.nativeElement.muted = this.isMuted;
  }

  public changeVolume(volume: any) {
    const volumeInput = volume.target.value;
    this.volume = volumeInput;

    this.bgVideo.nativeElement.volume = volumeInput / 100;

    localStorage.setItem('volume', volumeInput);

    if (this.iconVolume) {
      if (volumeInput == 0) {
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

    this.isMuted = volumeInput == 0 ? true : false;
    this.bgVideo.nativeElement.muted = this.isMuted;
  }

  public toggleMute(): void {
    if (this.bgVideo) {
      this.isMuted = !this.isMuted;
      this.bgVideo.nativeElement.muted = this.isMuted;

      if (this.iconVolume) {
        if (this.isMuted) {
          this.volume = 0;
          this.volumeInput.nativeElement.value = 0;

          this.renderer.removeClass(this.iconVolume.nativeElement, 'bxs-volume-full');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bxs-volume-mute');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bx-tada');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bx-flip-vertical');
        } else {
          const localVolume = localStorage.getItem('volume');
          this.volume = localVolume ? parseInt(localVolume) : 100;
          this.volumeInput.nativeElement.value = this.volume;
          this.bgVideo.nativeElement.volume = this.volume / 100;

          this.renderer.removeClass(this.iconVolume.nativeElement, 'bxs-volume-mute');
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bx-tada');
          this.renderer.removeClass(this.iconVolume.nativeElement, 'bx-flip-vertical');
          this.renderer.addClass(this.iconVolume.nativeElement, 'bxs-volume-full');
        }
      }
    }
  }
}
