import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileViewerComponent } from './profile-viewer.component';

describe('ProfileViewerComponent', () => {
  let component: ProfileViewerComponent;
  let fixture: ComponentFixture<ProfileViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
