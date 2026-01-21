import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faHashtag, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-search-modal',
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './search-modal.component.html',
    styleUrl: './search-modal.component.scss'
})
export class SearchModalComponent {
  
  // FontAwesome Icons
  faSearch = faSearch;
  faTimes = faTimes;
  faHashtag = faHashtag;
  faExclamationCircle = faExclamationCircle;
  faInfoCircle = faInfoCircle;

  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  public searchUserId: string = '';
  public searchError: string = '';

  public closeModal(): void {
    this.searchError = '';
    this.searchUserId = '';
    this.close.emit();
  }

  public searchProfile(): void {
    const trimmedId = this.searchUserId.trim();
    
    if (!trimmedId) {
      this.searchError = 'Please enter a Discord User ID';
      return;
    }

    if (!/^\d{17,19}$/.test(trimmedId)) {
      this.searchError = 'Invalid Discord ID format (must be 17-19 digits)';
      return;
    }

    this.search.emit(trimmedId);
    this.closeModal();
  }

  public handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchProfile();
    } else if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
