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
});
