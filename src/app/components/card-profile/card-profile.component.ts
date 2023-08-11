import { Component, OnInit, AfterViewInit } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile } from 'src/app/models/discord-profile.model';

declare global {
  interface Window {
    loadAtropos(): void;
  }
}

@Component({
  selector: 'app-card-profile',
  templateUrl: './card-profile.component.html',
  styleUrls: ['./card-profile.component.scss']
})
export class CardProfileComponent implements OnInit, AfterViewInit {

  userId: string = '602977635873718282';
  userDataStatus: boolean = false;
  userData?: Profile;
  userBioFormatted?: string = '';
  themesColor: Array<string> = []

  message: string = '';

  constructor(private discordApiServiceL: DiscordApiService) { }

  ngOnInit(): void {
    this.getDiscordUserData();
  }

  ngAfterViewInit(): void {
    window.loadAtropos();
  }

  public getDiscordUserData(): void {
    this.discordApiServiceL.getDiscordUser(this.userId).subscribe({
      next: (data: Profile) => {
        this.userDataStatus = true;
        this.userData = data;

        // Change all the /n to <br>
        this.userBioFormatted = this.userData.user_profile?.bio?.replace(/\n/g, '<br>');

        let themeColors = this.userData.user_profile?.theme_colors || [];
        if (themeColors.length == 0) {
          this.themesColor = ['#5C5C5C', '#5C5C5C'];
        } else {
          // Convert the decimal color to hex
          this.themesColor = themeColors.map((color) => {
            return '#' + color.toString(16).padStart(6, '0').toUpperCase();
          });
        }
      },
      error: (error) => {
        this.userDataStatus = false;
        console.log(error);
      }
    });
  }

  public sendMessage(): void {
    window.open('https://discord.com/users/' + this.userId, '_blank');

    this.message = '';
  }
}
