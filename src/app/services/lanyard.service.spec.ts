import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { LanyardService } from './lanyard.service';

describe('LanyardService', () => {
  let service: LanyardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [LanyardService]
    });
    service = TestBed.inject(LanyardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
