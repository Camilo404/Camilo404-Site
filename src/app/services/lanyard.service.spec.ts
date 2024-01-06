import { TestBed } from '@angular/core/testing';

import { LanyardService } from './lanyard.service';

describe('LanyardService', () => {
  let service: LanyardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanyardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
