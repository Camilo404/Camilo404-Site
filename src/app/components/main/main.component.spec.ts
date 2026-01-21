import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi())]
});
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
