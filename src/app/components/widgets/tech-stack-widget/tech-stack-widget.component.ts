import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import { faAngular, faReact, faBootstrap, faPython, faJs, faSass, faHtml5, faCss3Alt, faNodeJs, faGitAlt, faDocker } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-tech-stack-widget',
  standalone: true,
  templateUrl: './tech-stack-widget.component.html',
  styleUrls: ['./tech-stack-widget.component.scss'],
  imports: [FontAwesomeModule]
})
export class TechStackWidgetComponent {
  techStack = [
    { name: 'Angular', icon: faAngular, color: '#dd0031' },
    { name: 'React', icon: faReact, color: '#61dafb' },
    { name: 'Bootstrap', icon: faBootstrap, color: '#7952b3' },
    { name: 'Python', icon: faPython, color: '#3776ab' },
    { name: 'JavaScript', icon: faJs, color: '#f0db4f' },
    { name: 'TypeScript', icon: faCode, color: '#3178c6' },
    { name: 'Sass', icon: faSass, color: '#cc6699' },
    { name: 'HTML5', icon: faHtml5, color: '#e34f26' },
    { name: 'CSS3', icon: faCss3Alt, color: '#264de4' },
    { name: 'Node.js', icon: faNodeJs, color: '#339933' },
    { name: 'Git', icon: faGitAlt, color: '#f05032' },
    { name: 'Docker', icon: faDocker, color: '#2496ed' }
  ];
}
