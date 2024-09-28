import { Component, OnInit, Output, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile-viewer',
  templateUrl: './profile-viewer.component.html',
  styleUrl: './profile-viewer.component.scss'
})
export class ProfileViewerComponent implements OnInit {

  @Output() profileId!: string;

  constructor(private route: ActivatedRoute, private renderer: Renderer2) { }
  ngOnInit(): void {
    this.profileId = this.route.snapshot.paramMap.get('id') || environment.discordId;

    this.addKeyframes();
    setInterval(() => this.createSnowflake(), 200);
  }

  createSnowflake(): void {
    const snowflake = this.renderer.createElement('div');
    this.renderer.addClass(snowflake, 'snowflake');
    const text = this.renderer.createText('•');
    this.renderer.appendChild(snowflake, text);

    const fontSize = Math.random() * 24 + 10 + 'px';
    const leftPosition = Math.random() * window.innerWidth + 'px';
    const fallDuration = Math.random() * 10 + 10 + 's';
    const sideWaysDuration = Math.random() * 2 + 1 + 's';

    this.renderer.setStyle(snowflake, 'fontSize', fontSize);
    this.renderer.setStyle(snowflake, 'left', leftPosition);
    this.renderer.setStyle(snowflake, 'animation', `fall ${fallDuration} linear infinite, sideWays ${sideWaysDuration} ease-in-out infinite`);

    this.renderer.appendChild(document.body, snowflake);

    setTimeout(() => {
      this.renderer.removeChild(document.body, snowflake);
    }, Math.random() * 6000 + 6000);
  }

  addKeyframes(): void {
    const style = this.renderer.createElement('style');
    style.textContent = `
      @keyframes fall {
        0% { top: -50px; }
        100% { top: 100vh; }
      }
      @keyframes sideWays {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(20px); }
      }
    `;
    this.renderer.appendChild(document.head, style);
  }
}
