/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DiscordApiService } from './discord-api.service';

describe('Service: DiscordApi', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiscordApiService]
    });
  });

  it('should ...', inject([DiscordApiService], (service: DiscordApiService) => {
    expect(service).toBeTruthy();
  }));
});
