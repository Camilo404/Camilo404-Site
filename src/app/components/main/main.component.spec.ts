import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { Renderer2 } from '@angular/core';

import { MainComponent } from './main.component';

// Components
import { CustomCursorComponent } from '../custom-cursor/custom-cursor.component';
import { ClockComponent } from '../clock/clock.component';
import { CardProfileComponent } from '../card-profile/card-profile.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  let renderer: Renderer2;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MainComponent,
        CustomCursorComponent,
        ClockComponent,
        CardProfileComponent
      ],
      imports: [HttpClientModule],
      providers: [Renderer2]
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

//   it('should toggle mute and update UI properly', () => {
//     spyOnProperty(component.bgVideo.nativeElement, 'muted', 'set');
//     spyOn(renderer, 'removeClass');
//     spyOn(renderer, 'addClass');
//     spyOn(localStorage, 'getItem').and.returnValue('50');
//     component.toggleMute();
//     expect(component.isMuted).toEqual(false);
//     expect(component.volume).toEqual(50);
//     expect(component.bgVideo.nativeElement.muted).toEqual(false);
//     expect(localStorage.getItem).toHaveBeenCalled();
//     expect(renderer.removeClass).toHaveBeenCalled(); // Verificar si se llamó al método removeClass
//     expect(renderer.addClass).toHaveBeenCalled(); // Verificar si se llamó al método addClass
//     // Agregar más expectativas según sea necesario para las actualizaciones de la interfaz de usuario
// });

});
