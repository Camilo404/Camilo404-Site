import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { MainComponent } from './main.component';

// Components
import { CustomCursorComponent } from '../custom-cursor/custom-cursor.component';
import { ClockComponent } from '../clock/clock.component';
import { CardProfileComponent } from '../card-profile/card-profile.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MainComponent,
        CustomCursorComponent,
        ClockComponent,
        CardProfileComponent
      ],
      imports: [HttpClientModule]
    });
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set bgVideo muted property after view initialization', () => {
    spyOnProperty(component.bgVideo.nativeElement, 'muted', 'set');
    component.ngAfterViewInit();
    expect(component.bgVideo.nativeElement.muted).toEqual(true);
  });


  it('should change volume and update UI properly', () => {
    spyOn(localStorage, 'setItem');
    component.changeVolume({ target: { value: 50 } });
    expect(component.volume).toEqual(50);
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(component.isMuted).toEqual(false);
    expect(component.bgVideo.nativeElement.volume).toEqual(0.5); // 50/100
  });
});
