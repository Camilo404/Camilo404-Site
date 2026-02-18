import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilsService {

  /**
   * Converts hex color to RGB object
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  /**
   * Converts RGB to HSL
   */
  rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h, s, l };
  }

  /**
   * Converts HSL to RGB
   */
  hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r * 255, g * 255, b * 255];
  }

  /**
   * Generates a deep dark variant of a color
   */
  generateDeepVariant(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.floor(r * 0.15);
    const newG = Math.floor(g * 0.15);
    const newB = Math.floor(b * 0.15);
    
    return '#' + [newR, newG, newB]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates a vibrant variant with adjustable intensity
   */
  generateVibranceVariant(hex: string, intensity: number): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    const newS = Math.min(1, s * (1 + intensity * 0.3));
    const newL = l * (0.5 + intensity * 0.2);
    
    const rgb = this.hslToRgb(h, newS, newL);
    return '#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a complementary dark color
   */
  generateComplementaryDark(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const { h, s } = this.rgbToHsl(r, g, b);
    
    const newH = (h + 0.15) % 1;
    const newS = s * 0.8;
    const newL = 0.12;
    
    const rgb = this.hslToRgb(newH, newS, newL);
    return '#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Darkens a color by a given factor
   */
  darkenColor(hex: string, factor: number): string {
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);
    
    return '#' + [newR, newG, newB]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates sophisticated particle colors from theme colors
   */
  generateSophisticatedParticleColors(themeColors: string[]): string[] {
    if (themeColors.length === 0) {
      return ['#a78bfa', '#c084fc', '#e879f9', '#60a5fa', '#818cf8', '#f472b6', '#fb7185', '#fbbf24'];
    }
    
    const variations: string[] = [];
    
    themeColors.forEach(color => {
      const baseRgb = this.hexToRgb(color);
      const { h, s, l } = this.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
      
      for (let i = 0; i < 5; i++) {
        const hueShift = (h + (i * 0.05)) % 1;
        const satVariation = Math.max(0.5, Math.min(1, s + (i - 2) * 0.1));
        const lightVariation = Math.max(0.4, Math.min(0.8, l + (i - 2) * 0.1));
        
        const rgb = this.hslToRgb(hueShift, satVariation, lightVariation);
        variations.push('#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join(''));
      }
    });
    
    return variations;
  }
}
