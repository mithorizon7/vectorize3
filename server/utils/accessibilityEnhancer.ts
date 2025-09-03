import { JSDOM } from 'jsdom';

/**
 * Accessibility enhancement utilities for SVG animations
 * Adds WCAG-compliant accessibility features and reduced motion support
 */

export interface AccessibilityOptions {
  addRoleImg: boolean;
  addTitleDesc: boolean;
  addReducedMotionSupport: boolean;
  addFocusStates: boolean;
  generateAltText?: string;
  customTitle?: string;
  customDescription?: string;
}

export interface AccessibilityMetadata {
  hasRole: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasReducedMotionSupport: boolean;
  elementCount: number;
  interactiveElements: number;
}

/**
 * Enhance SVG with accessibility features
 */
export function enhanceAccessibility(
  svgContent: string,
  options: AccessibilityOptions
): { svg: string; metadata: AccessibilityMetadata } {
  try {
    console.log('Enhancing SVG accessibility with options:', options);
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    const metadata: AccessibilityMetadata = {
      hasRole: false,
      hasTitle: false,
      hasDescription: false,
      hasReducedMotionSupport: false,
      elementCount: 0,
      interactiveElements: 0
    };

    // Add role="img" for screen readers
    if (options.addRoleImg) {
      svgElement.setAttribute('role', 'img');
      svgElement.setAttribute('aria-hidden', 'false');
      metadata.hasRole = true;
      console.log('Added role="img" and aria-hidden="false"');
    }

    // Add title element for screen readers
    if (options.addTitleDesc) {
      // Remove existing title and desc elements
      const existingTitle = svgElement.querySelector('title');
      const existingDesc = svgElement.querySelector('desc');
      if (existingTitle) existingTitle.remove();
      if (existingDesc) existingDesc.remove();

      // Create new title element
      const titleElement = document.createElement('title');
      const titleText = options.customTitle || 
                       options.generateAltText || 
                       'Animated SVG illustration';
      titleElement.textContent = titleText;
      
      // Insert at the beginning of SVG
      svgElement.insertBefore(titleElement, svgElement.firstChild);
      metadata.hasTitle = true;
      console.log(`Added title: "${titleText}"`);

      // Create description element if custom description provided
      if (options.customDescription) {
        const descElement = document.createElement('desc');
        descElement.textContent = options.customDescription;
        svgElement.insertBefore(descElement, titleElement.nextSibling);
        metadata.hasDescription = true;
        console.log(`Added description: "${options.customDescription}"`);
      }

      // Set aria-labelledby to reference title
      const titleId = 'svg-title-' + Math.random().toString(36).slice(2, 8);
      titleElement.setAttribute('id', titleId);
      svgElement.setAttribute('aria-labelledby', titleId);
      
      if (options.customDescription) {
        const descId = 'svg-desc-' + Math.random().toString(36).slice(2, 8);
        const descElement = svgElement.querySelector('desc');
        if (descElement) {
          descElement.setAttribute('id', descId);
          svgElement.setAttribute('aria-describedby', descId);
        }
      }
    }

    // Add focus states for interactive elements
    if (options.addFocusStates) {
      const interactiveSelectors = ['[onclick]', '[onmouseover]', '[style*="cursor:"]'];
      const interactiveElements = svgElement.querySelectorAll(interactiveSelectors.join(','));
      
      Array.from(interactiveElements).forEach((element, index) => {
        // Add tabindex for keyboard navigation
        element.setAttribute('tabindex', '0');
        
        // Add role for screen readers
        element.setAttribute('role', 'button');
        
        // Add focus-visible styling
        const focusClass = `focus-element-${index}`;
        element.setAttribute('class', (element.getAttribute('class') || '') + ` ${focusClass}`);
        
        metadata.interactiveElements++;
      });

      console.log(`Enhanced ${metadata.interactiveElements} interactive elements with focus states`);
    }

    // Add reduced motion support
    if (options.addReducedMotionSupport) {
      // Add data attributes for animation control
      const animatableElements = svgElement.querySelectorAll('[data-animate], [style*="animation"], [style*="transition"]');
      
      Array.from(animatableElements).forEach(element => {
        element.setAttribute('data-respects-reduced-motion', 'true');
      });

      // Add CSS class for reduced motion control
      svgElement.setAttribute('class', (svgElement.getAttribute('class') || '') + ' respects-reduced-motion');
      metadata.hasReducedMotionSupport = true;
      console.log('Added reduced motion support attributes');
    }

    // Count elements for complexity assessment
    metadata.elementCount = svgElement.querySelectorAll('path, rect, circle, ellipse, polygon, line, g').length;

    const enhancedSvg = dom.serialize();
    
    console.log('Accessibility enhancement complete:', metadata);
    
    return {
      svg: enhancedSvg,
      metadata
    };
    
  } catch (error) {
    console.error('Error enhancing accessibility:', error);
    return {
      svg: svgContent,
      metadata: {
        hasRole: false,
        hasTitle: false,
        hasDescription: false,
        hasReducedMotionSupport: false,
        elementCount: 0,
        interactiveElements: 0
      }
    };
  }
}

/**
 * Generate accessibility-aware CSS for animations
 */
export function generateAccessibilityCSS(options: AccessibilityOptions): string {
  let css = '';

  // Add reduced motion support
  if (options.addReducedMotionSupport) {
    css += `
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .respects-reduced-motion [data-respects-reduced-motion="true"] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .respects-reduced-motion .draw-on {
    animation: none !important;
    stroke-dashoffset: 0 !important;
  }
}

/* Enhanced focus states for accessibility */
.focus-element:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .respects-reduced-motion path {
    stroke-width: 2px;
  }
  
  .respects-reduced-motion text {
    font-weight: bold;
  }
}
`;
  }

  // Add focus state styles
  if (options.addFocusStates) {
    css += `
/* Interactive element focus styles */
[role="button"]:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 1px;
  filter: drop-shadow(0 0 4px rgba(0, 102, 204, 0.3));
}

[role="button"]:hover {
  cursor: pointer;
  filter: brightness(1.1);
}

[role="button"][tabindex="0"] {
  transition: filter 0.2s ease;
}
`;
  }

  return css.trim();
}

/**
 * Generate enhanced code with accessibility features
 */
export function generateAccessibleGSAP(elements: Array<{id: string; hasAnimation: boolean}>): string {
  return `// GSAP Animation with Accessibility Support
import { gsap } from "gsap";

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createAccessibleAnimation() {
  // Create timeline with reduced motion support
  const tl = gsap.timeline({
    duration: prefersReducedMotion ? 0.01 : 1.5,
    ease: prefersReducedMotion ? "none" : "power2.out"
  });
  
  ${elements.map(el => `
  // Animation for ${el.id}
  tl.${el.hasAnimation ? 'fromTo' : 'to'}("#${el.id}", {
    ${el.hasAnimation ? 'opacity: 0,' : ''}
    ${el.hasAnimation ? '// Reduced motion: minimal animation' : ''}
  }, {
    opacity: 1,
    duration: prefersReducedMotion ? 0.01 : 1,
    ease: prefersReducedMotion ? "none" : "power2.out"
  });`).join('\n')}
  
  return tl;
}

// Initialize with accessibility considerations
document.addEventListener('DOMContentLoaded', () => {
  const animation = createAccessibleAnimation();
  
  // Pause/resume based on visibility
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animation.play();
      } else {
        animation.pause();
      }
    });
  });
  
  const svgElement = document.querySelector('svg[role="img"]');
  if (svgElement) {
    observer.observe(svgElement);
  }
});`;
}

/**
 * Auto-generate meaningful alt text from SVG content
 */
export function generateAltText(svgContent: string): string {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) return 'SVG illustration';

    // Count different element types
    const paths = svgElement.querySelectorAll('path').length;
    const circles = svgElement.querySelectorAll('circle').length;
    const rects = svgElement.querySelectorAll('rect').length;
    const texts = svgElement.querySelectorAll('text').length;

    // Extract colors
    const colors = new Set<string>();
    svgElement.querySelectorAll('*').forEach(el => {
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      if (fill && fill !== 'none') colors.add(fill);
      if (stroke && stroke !== 'none') colors.add(stroke);
    });

    // Generate descriptive text
    let description = 'SVG illustration';
    
    if (texts > 0) {
      description = 'SVG diagram with text elements';
    } else if (circles > 3 && paths > 3) {
      description = 'Complex SVG illustration with multiple shapes';
    } else if (circles > 0 && rects > 0) {
      description = 'SVG illustration with geometric shapes';
    } else if (paths > 5) {
      description = 'Detailed SVG illustration with curved paths';
    }

    // Add color information
    if (colors.size > 0) {
      const colorArray = Array.from(colors);
      if (colorArray.length <= 3) {
        description += ` in ${colorArray.join(', ')} colors`;
      } else {
        description += ` with multiple colors`;
      }
    }

    return description;
    
  } catch (error) {
    console.error('Error generating alt text:', error);
    return 'SVG illustration';
  }
}