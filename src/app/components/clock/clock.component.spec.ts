import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ClockComponent } from './clock.component';

describe('ClockComponent', () => {
  let component: ClockComponent;
  let fixture: ComponentFixture<ClockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClockComponent]
    });
    fixture = TestBed.createComponent(ClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update time properly', fakeAsync(() => {
    const getCurrentTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // La hora '0' debe ser '12'
      const formattedHours = hours < 10 ? '0' + hours : hours;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
      return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds + ' ' + ampm;
    };

    // Comprobar que el tiempo se actualiza correctamente llamando a updateTime
    component.updateTime();
    expect(component.strTime).toEqual(getCurrentTime());

    // Avanzar el tiempo en 1 segundo
    tick(1000);
    fixture.detectChanges();

    // Comprobar que el tiempo se actualiza correctamente después de 1 segundo
    component.updateTime();
    expect(component.strTime).toEqual(getCurrentTime());
  }));

  it('should update strTime variable properly', () => {
    // Obtener la hora actual
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora '0' debe ser '12'
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    const expectedStrTime = formattedHours + ':' + formattedMinutes + ':' + formattedSeconds + ' ' + ampm;

    // Llamar a updateTime() y comprobar que strTime se actualiza correctamente
    component.updateTime();
    expect(component.strTime).toEqual(expectedStrTime);
  });

});
