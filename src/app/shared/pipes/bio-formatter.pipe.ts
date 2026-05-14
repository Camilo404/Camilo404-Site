import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'bioFormatter', standalone: true, pure: true })
export class BioFormatterPipe implements PipeTransform {
  transform(bio: string | null | undefined): string {
    if (!bio) return '';
    return this.parseBio(bio);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private simpleMarkdown(text: string): string {
    if (!text) return '';

    // First escape HTML to prevent XSS
    let html = this.escapeHtml(text);

    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italics (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.*?)_/g, '<i>$1</i>');

    // Underline (__text__)
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');

    // Strikethrough (~~text~~)
    html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

    // Monospace (`text`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks (```text```) - simplified (multiline support)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Auto-link URLs (bare links)
    // Avoid double linking by checking if it's already inside an <a> tag or src attribute
    html = html.replace(/(?<!href="|">)(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes (> text)
    html = html.replace(/^&gt; ?(.*$)/gm, '<blockquote>$1</blockquote>');

    // Merge consecutive blockquotes to look like one block
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private parseBio(bio: string): string {
    if (!bio) return '';

    // 1. Parse standard Markdown
    let html = this.simpleMarkdown(bio);

    // 2. Parse Custom Emojis
    const emojiRegex = /(&lt;|<)(a?):([a-zA-Z0-9_]+):(\d+)(&gt;|>)/g;

    html = html.replace(emojiRegex, (match, left, animated, name, id) => {
      const isAnimated = animated === 'a';
      const ext = isAnimated ? 'gif' : 'png';
      return `<img src="https://cdn.discordapp.com/emojis/${id}.${ext}" alt=":${name}:" title=":${name}:" class="discord-emoji">`;
    });

    return html;
  }
}
