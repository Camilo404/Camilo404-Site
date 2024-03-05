import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { CardProfileComponent } from './card-profile.component';

describe('CardProfileComponent', () => {
  let component: CardProfileComponent;
  let fixture: ComponentFixture<CardProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardProfileComponent],
      imports: [HttpClientModule]
    });
    fixture = TestBed.createComponent(CardProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
