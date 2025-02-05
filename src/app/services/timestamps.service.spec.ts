import { TestBed } from '@angular/core/testing';

import { TimestampsService } from './timestamps.service';

describe('TimestampsService', () => {
  let service: TimestampsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimestampsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
