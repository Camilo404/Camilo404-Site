import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faHashtag, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-search-modal',
    standalone: true,
    imports: [FormsModule, FontAwesomeModule],
    templateUrl: './search-modal.component.html',
    styleUrl: './search-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchModalComponent {
  
  // FontAwesome Icons
  faSearch = faSearch;
  faTimes = faTimes;
  faHashtag = faHashtag;
  faExclamationCircle = faExclamationCircle;
  faInfoCircle = faInfoCircle;

  isOpen = input<boolean>(false);
  close = output<void>();
  search = output<string>();

  searchUserId = signal<string>('');
  searchError = signal<string>('');

  public closeModal(): void {
    this.searchError.set('');
    this.searchUserId.set('');
    this.close.emit();
  }

  public searchProfile(): void {
    const trimmedId = this.searchUserId().trim();
    
    if (!trimmedId) {
      this.searchError.set('Please enter a Discord User ID');
      return;
    }

    if (!/^\d{17,19}$/.test(trimmedId)) {
      this.searchError.set('Invalid Discord ID format (must be 17-19 digits)');
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
