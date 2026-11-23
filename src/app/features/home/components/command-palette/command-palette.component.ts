import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export interface PaletteCommand {
  id: string;
  label: string;
  group: 'Go to' | 'Actions';
  icon: IconDefinition;
  /** Right-aligned hint, e.g. a handle or domain */
  hint?: string;
  /** Extra words that should match the search */
  keywords?: string;
  /** Opens in a new tab */
  href?: string;
  /** Runs after the palette closes; return a message to show as a toast */
  run?: () => string | void | Promise<string | void>;
}

/** Fuzzy-ish match: every query word must appear in label/hint/keywords. */
function matches(cmd: PaletteCommand, query: string): boolean {
  const hay = `${cmd.label} ${cmd.hint ?? ''} ${cmd.keywords ?? ''} ${cmd.group}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/**
 * ⌘K / Ctrl+K command palette (also "/"): a native modal <dialog> with a
 * combobox-style list. Commands come from the page so they can reach widgets.
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  imports: [FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onGlobalKey($event)',
  },
})
export class CommandPaletteComponent {
  readonly commands = input.required<PaletteCommand[]>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('search');
  private readonly destroyRef = inject(DestroyRef);

  readonly faSearch = faMagnifyingGlass;
  readonly isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  readonly query = signal('');
  readonly active = signal(0);
  readonly toast = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly filtered = computed(() => {
    const q = this.query().trim();
    return q ? this.commands().filter((c) => matches(c, q)) : this.commands();
  });

  /** Groups in a stable order, each with its items' flat indexes (for keyboard nav). */
  readonly groups = computed(() => {
    const list = this.filtered();
    return (['Go to', 'Actions'] as const)
      .map((name) => ({
        name,
        items: list.map((cmd, index) => ({ cmd, index })).filter((x) => x.cmd.group === name),
      }))
      .filter((g) => g.items.length);
  });

  constructor() {
    afterNextRender(() => {
      // Backdrop clicks land on the <dialog> element itself
      const dialog = this.dialog().nativeElement;
      const onClick = (e: MouseEvent) => {
        if (e.target === dialog) this.close();
      };
      dialog.addEventListener('click', onClick);
      this.destroyRef.onDestroy(() => dialog.removeEventListener('click', onClick));
    });
  }

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) return;
    this.query.set('');
    this.active.set(0);
    dialog.showModal();
    this.searchInput().nativeElement.focus();
  }

  close(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) dialog.close();
  }

  onGlobalKey(event: KeyboardEvent): void {
    const isK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
    const target = event.target as HTMLElement | null;
    const typing = !!target?.closest('input, textarea, [contenteditable="true"]');
    const isSlash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
    if (!isK && !isSlash) return;

    event.preventDefault();
    if (this.dialog().nativeElement.open) this.close();
    else this.open();
  }

  onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  onListKey(event: KeyboardEvent): void {
    const count = this.filtered().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!count) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.active.update((i) => (i + step + count) % count);
      this.scrollActiveIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.filtered()[this.active()];
      if (cmd) this.execute(cmd);
    }
  }

  async execute(cmd: PaletteCommand): Promise<void> {
    this.close();
    if (cmd.href) {
      window.open(cmd.href, '_blank', 'noopener,noreferrer');
      return;
    }
    const message = await cmd.run?.();
    if (message) this.showToast(message);
  }

  private showToast(message: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2200);
  }

  private scrollActiveIntoView(): void {
    queueMicrotask(() =>
      this.dialog()
        .nativeElement.querySelector(`#cmd-${this.active()}`)
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }
}
