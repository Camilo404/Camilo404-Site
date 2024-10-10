import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NekoComponent } from './neko.component';

describe('NekoComponent', () => {
  let component: NekoComponent;
  let fixture: ComponentFixture<NekoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NekoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NekoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
