import { Injectable, ElementRef, Renderer2, RendererFactory2 } from '@angular/core';

export interface Card3DConfig {
  rotateX: number;
  rotateY: number;
  scale: number;
  perspective: number;
  transition: string;
  shadowIntensity: number;
  maxRotation: number;
}

@Injectable({
  providedIn: 'root'
})
export class Card3DEffectService {
  private renderer: Renderer2;
  private defaultConfig: Card3DConfig = {
    rotateX: 0,
    rotateY: 0,
    scale: 1.05,
    perspective: 1000,
    transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
    shadowIntensity: 0.3,
    maxRotation: 15
  };

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  initCard3DEffect(element: ElementRef, config?: Partial<Card3DConfig>): void {
    // Si es un dispositivo móvil (ancho <= 768px), no aplicar el efecto inicial
    if (window.innerWidth <= 768) {
      return;
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const cardElement = element.nativeElement;

    this.setupInitialStyles(cardElement, finalConfig);
    this.addEventListeners(cardElement, finalConfig);
  }

  private setupInitialStyles(element: HTMLElement, config: Card3DConfig): void {
    this.renderer.setStyle(element, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(element, 'perspective', `${config.perspective}px`);
    this.renderer.setStyle(element, 'transition', `transform ${config.transition}`);
    this.renderer.setStyle(element, 'will-change', 'transform');
  }

  private addEventListeners(element: HTMLElement, config: Card3DConfig): void {
    // Mouse events
    this.renderer.listen(element, 'mouseenter', () => {
      this.onMouseEnter(element, config);
    });

    this.renderer.listen(element, 'mousemove', (event: MouseEvent) => {
      this.onMouseMove(element, event, config);
    });

    this.renderer.listen(element, 'mouseleave', () => {
      this.onMouseLeave(element, config);
    });

    // Touch events for mobile devices
    this.renderer.listen(element, 'touchstart', (event: TouchEvent) => {
      this.onTouchStart(element, event, config);
    });

    this.renderer.listen(element, 'touchmove', (event: TouchEvent) => {
      this.onTouchMove(element, event, config);
    });

    this.renderer.listen(element, 'touchend', () => {
      this.onTouchEnd(element, config);
    });
  }

  private onMouseEnter(element: HTMLElement, config: Card3DConfig): void {
    this.renderer.setStyle(element, 'transition', 'transform 0.2s ease-out');
    this.renderer.setStyle(element, 'perspective', `${config.perspective}px`);
  }

  private onMouseMove(element: HTMLElement, event: MouseEvent, config: Card3DConfig): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    const rotateY = (mouseX / (rect.width / 2)) * config.maxRotation;
    const rotateX = -(mouseY / (rect.height / 2)) * config.maxRotation;

    // Aplicar la transformación
    const transform = `
      perspective(${config.perspective}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(${config.scale})
    `;

    this.renderer.setStyle(element, 'transform', transform);

    this.applyChildrenEffects(element, rotateX, rotateY);
  }

  private onMouseLeave(element: HTMLElement, config: Card3DConfig): void {
    this.renderer.setStyle(element, 'transition', 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    this.renderer.setStyle(element, 'transform', `perspective(${config.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`);

    this.resetChildrenEffects(element);
  }

  // Touch event handlers for mobile devices
  private onTouchStart(element: HTMLElement, event: TouchEvent, config: Card3DConfig): void {
    if (window.innerWidth <= 768) return;
    
    event.preventDefault();
    this.renderer.setStyle(element, 'transition', 'transform 0.2s ease-out');
    this.renderer.setStyle(element, 'perspective', `${config.perspective}px`);
  }

  private onTouchMove(element: HTMLElement, event: TouchEvent, config: Card3DConfig): void {
    if (window.innerWidth <= 768) return;

    event.preventDefault();
    
    // Get the first touch point
    const touch = event.touches[0];
    if (!touch) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touchX = touch.clientX - centerX;
    const touchY = touch.clientY - centerY;

    const rotateY = (touchX / (rect.width / 2)) * config.maxRotation;
    const rotateX = -(touchY / (rect.height / 2)) * config.maxRotation;

    // Apply the transformation
    const transform = `
      perspective(${config.perspective}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(${config.scale})
    `;

    this.renderer.setStyle(element, 'transform', transform);
    this.applyChildrenEffects(element, rotateX, rotateY);
  }

  private onTouchEnd(element: HTMLElement, config: Card3DConfig): void {
    this.renderer.setStyle(element, 'transition', 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    this.renderer.setStyle(element, 'transform', `perspective(${config.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`);

    this.resetChildrenEffects(element);
  }

  private applyChildrenEffects(element: HTMLElement, rotateX: number, rotateY: number): void {
    const childrenWithOffset = element.querySelectorAll('[data-offset]');
    
    childrenWithOffset.forEach((child: Element) => {
      const offset = parseFloat(child.getAttribute('data-offset') || '1');
      const childRotateX = rotateX * offset;
      const childRotateY = rotateY * offset;
      
      const childTransform = `
        translateZ(${offset * 10}px)
        rotateX(${childRotateX}deg)
        rotateY(${childRotateY}deg)
      `;
      
      this.renderer.setStyle(child, 'transform', childTransform);
      this.renderer.setStyle(child, 'transition', 'transform 0.15s ease-out');
    });

    const childrenWithOpacity = element.querySelectorAll('[data-opacity]');
    childrenWithOpacity.forEach((child: Element) => {
      const opacityRange = child.getAttribute('data-opacity')?.split(';') || ['0.9', '1'];
      const minOpacity = parseFloat(opacityRange[0]);
      const maxOpacity = parseFloat(opacityRange[1]);
      
      const intensity = (Math.abs(rotateX) + Math.abs(rotateY)) / 30;
      const opacity = minOpacity + (maxOpacity - minOpacity) * Math.min(intensity, 1);
      
      this.renderer.setStyle(child, 'opacity', opacity.toString());
      this.renderer.setStyle(child, 'transition', 'opacity 0.15s ease-out');
    });
  }

  private resetChildrenEffects(element: HTMLElement): void {
    const childrenWithOffset = element.querySelectorAll('[data-offset]');
    childrenWithOffset.forEach((child: Element) => {
      this.renderer.setStyle(child, 'transform', 'translateZ(0px) rotateX(0deg) rotateY(0deg)');
      this.renderer.setStyle(child, 'transition', 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    });

    const childrenWithOpacity = element.querySelectorAll('[data-opacity]');
    childrenWithOpacity.forEach((child: Element) => {
      const opacityRange = child.getAttribute('data-opacity')?.split(';') || ['0.9', '1'];
      const minOpacity = parseFloat(opacityRange[0]);
      this.renderer.setStyle(child, 'opacity', minOpacity.toString());
      this.renderer.setStyle(child, 'transition', 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
    });
  }

  destroyCard3DEffect(element: ElementRef): void {
    const cardElement = element.nativeElement;
    
    this.renderer.removeStyle(cardElement, 'transform');
    this.renderer.removeStyle(cardElement, 'transition');
    this.renderer.removeStyle(cardElement, 'box-shadow');
  }
}