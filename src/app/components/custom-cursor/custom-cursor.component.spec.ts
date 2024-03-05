import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomCursorComponent } from './custom-cursor.component';

describe('CustomCursorComponent', () => {
  let component: CustomCursorComponent;
  let fixture: ComponentFixture<CustomCursorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomCursorComponent]
    });
    fixture = TestBed.createComponent(CustomCursorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set ring position on mouse move', () => {
    const mockMouseEvent = {
      clientX: 100,
      clientY: 200
    } as MouseEvent;

    const ringElement = fixture.nativeElement.querySelector('#ring');
    component.ngOnInit();
    document.dispatchEvent(new MouseEvent('mousemove', mockMouseEvent));

    fixture.detectChanges();

    expect(ringElement.style.transform).toContain('translate(calc(100px - 1rem), calc(200px - 1rem))');
  });

  it('should hide ring on mouse out when not over a related target', () => {
    const ringElement = fixture.nativeElement.querySelector('#ring');
    component.ngAfterViewInit();
    document.dispatchEvent(new Event('mouseout'));

    fixture.detectChanges();

    expect(ringElement.style.display).toBe('none');
  });

  it('should show ring on mouse over', () => {
    const ringElement = fixture.nativeElement.querySelector('#ring');
    component.ngAfterViewInit();
    document.dispatchEvent(new Event('mouseover'));

    fixture.detectChanges();

    expect(ringElement.style.display).toBe('block');
  });

  it('should add hover class on mouse over hovered elements', () => {
    const ringElement = fixture.nativeElement.querySelector('#ring');
    const hoveredElement = document.createElement('div');
    hoveredElement.classList.add('hovered');
    document.body.appendChild(hoveredElement);
    component.ngAfterViewInit();
    hoveredElement.dispatchEvent(new Event('mouseover'));

    fixture.detectChanges();

    expect(ringElement.classList.contains('hover')).toBeTruthy();

    hoveredElement.dispatchEvent(new Event('mouseout'));
    fixture.detectChanges();

    expect(ringElement.classList.contains('hover')).toBeFalsy();
    document.body.removeChild(hoveredElement);
  });
});
