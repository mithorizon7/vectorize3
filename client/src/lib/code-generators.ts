/**
 * Animation Code Generators
 * Generates production-ready code for different animation frameworks
 */

export interface PivotPoint {
  x: number;
  y: number;
  elementId: string;
  transformOrigin: string;
  relativeX: number;
  relativeY: number;
}

export interface AnimationElement {
  id: string;
  type: string;
  bounds?: { x: number; y: number; width: number; height: number };
  pivot?: PivotPoint;
  colors?: string[];
  pathLength?: number;
  hasStroke?: boolean;
  strokeWidth?: string;
  strokeColor?: string;
}

export interface CodeGeneratorOptions {
  framework: 'gsap' | 'css' | 'waapi' | 'react';
  includeComments: boolean;
  useCSSVariables: boolean;
  animationType: 'entrance' | 'hover' | 'click' | 'scroll' | 'loop' | 'drawon' | 'custom';
  duration: number;
  easing: string;
  stagger?: number;
  responsive: boolean;
}

export interface GeneratedCode {
  code: string;
  css?: string;
  imports?: string[];
  dependencies?: string[];
  instructions: string;
  preview?: string; // HTML preview code
}

/**
 * GSAP Code Generator - Professional animation library
 */
export function generateGSAPCode(
  svgContent: string,
  elements: AnimationElement[],
  pivotPoints: PivotPoint[],
  options: CodeGeneratorOptions
): GeneratedCode {
  const elementsWithPivots = elements.map(element => ({
    ...element,
    pivot: pivotPoints.find(p => p.elementId === element.id)
  }));

  const imports = [
    'import { gsap } from "gsap";'
  ];

  // Add scroll trigger if needed
  if (options.animationType === 'scroll') {
    imports.push('import { ScrollTrigger } from "gsap/ScrollTrigger";');
    imports.push('gsap.registerPlugin(ScrollTrigger);');
  }

  const timeline = generateGSAPTimeline(elementsWithPivots, options);
  const css = generateGSAPCSS(elementsWithPivots, options);

  const code = `${imports.join('\n')}

${options.includeComments ? '// Animation setup for SVG elements' : ''}
function initSVGAnimation() {
  ${options.includeComments ? '// Create GSAP timeline' : ''}
  const tl = gsap.timeline({
    ${options.animationType === 'loop' ? 'repeat: -1,' : ''}
    ${options.animationType === 'scroll' ? 'scrollTrigger: {\n      trigger: ".svg-container",\n      start: "top 80%",\n      end: "bottom 20%",\n      scrub: true\n    },' : ''}
    ease: "${options.easing}",
    duration: ${options.duration}
  });

${timeline}

  return tl;
}

${options.includeComments ? '// Initialize animation when DOM is ready' : ''}
document.addEventListener('DOMContentLoaded', () => {
  const animation = initSVGAnimation();
  
  ${generateGSAPEventHandlers(options)}
});

${generateGSAPHelperFunctions(elementsWithPivots, options)}`;

  return {
    code,
    css,
    imports: ['gsap'],
    dependencies: ['gsap'],
    instructions: `
## GSAP Animation Setup

1. **Install GSAP**: \`npm install gsap\`
2. **Add the SVG** to your HTML with class "svg-container"
3. **Include the generated CSS** for responsive behavior
4. **Run the JavaScript** to initialize animations

## Usage Tips
- Adjust duration and easing in the timeline options
- Use \`animation.pause()\` and \`animation.play()\` for control
- Add \`ScrollTrigger\` for scroll-based animations
- Customize \`stagger\` values for sequence effects
`,
    preview: generateGSAPPreview(svgContent, elementsWithPivots, options)
  };
}

/**
 * Generate GSAP timeline code
 */
function generateGSAPTimeline(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const animations: string[] = [];
  const stagger = options.stagger || 0.1;

  elements.forEach((element, index) => {
    const selector = `#${element.id}`;
    const delay = index * stagger;
    
    switch (options.animationType) {
      case 'entrance':
        animations.push(generateEntranceAnimation(selector, element, delay, options));
        break;
      case 'loop':
        animations.push(generateLoopAnimation(selector, element, delay, options));
        break;
      case 'hover':
        animations.push(generateHoverAnimation(selector, element, options));
        break;
      case 'scroll':
        animations.push(generateScrollAnimation(selector, element, delay, options));
        break;
      case 'drawon':
        animations.push(generateDrawOnAnimation(selector, element, delay, options));
        break;
      default:
        animations.push(generateCustomAnimation(selector, element, delay, options));
    }
  });

  return animations.map(anim => `  ${anim}`).join('\n\n');
}

/**
 * Generate entrance animations
 */
function generateEntranceAnimation(selector: string, element: AnimationElement, delay: number, options: CodeGeneratorOptions): string {
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `tl.fromTo("${selector}", {
    opacity: 0,
    scale: 0.3,
    rotation: -180,
    transformOrigin: "${transformOrigin}"
  }, {
    opacity: 1,
    scale: 1,
    rotation: 0,
    duration: ${options.duration},
    ease: "${options.easing}",
    delay: ${delay.toFixed(2)}
  });`;
}

/**
 * Generate loop animations
 */
function generateLoopAnimation(selector: string, element: AnimationElement, delay: number, options: CodeGeneratorOptions): string {
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `tl.to("${selector}", {
    rotation: 360,
    transformOrigin: "${transformOrigin}",
    duration: ${options.duration},
    ease: "none",
    delay: ${delay.toFixed(2)}
  });`;
}

/**
 * Generate hover animations (event-based)
 */
function generateHoverAnimation(selector: string, element: AnimationElement, options: CodeGeneratorOptions): string {
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `// Hover animation for ${selector}
  const hover${element.id} = gsap.to("${selector}", {
    scale: 1.1,
    rotation: 5,
    transformOrigin: "${transformOrigin}",
    duration: 0.3,
    ease: "power2.out",
    paused: true
  });
  
  document.querySelector("${selector}").addEventListener('mouseenter', () => hover${element.id}.play());
  document.querySelector("${selector}").addEventListener('mouseleave', () => hover${element.id}.reverse());`;
}

/**
 * Generate scroll animations
 */
function generateScrollAnimation(selector: string, element: AnimationElement, delay: number, options: CodeGeneratorOptions): string {
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `tl.fromTo("${selector}", {
    y: 50,
    opacity: 0,
    scale: 0.8,
    transformOrigin: "${transformOrigin}"
  }, {
    y: 0,
    opacity: 1,
    scale: 1,
    duration: ${options.duration},
    ease: "${options.easing}",
    delay: ${delay.toFixed(2)}
  });`;
}

/**
 * Generate draw-on animations for stroked paths
 */
function generateDrawOnAnimation(selector: string, element: AnimationElement, delay: number, options: CodeGeneratorOptions): string {
  if (!element.pathLength || !element.hasStroke) {
    return `// ${selector} has no stroke or path length - skipping draw-on animation`;
  }
  
  const pathLength = Math.ceil(element.pathLength);
  
  return `tl.fromTo("${selector}", {
    strokeDasharray: ${pathLength},
    strokeDashoffset: ${pathLength}
  }, {
    strokeDashoffset: 0,
    duration: ${options.duration},
    ease: "${options.easing}",
    delay: ${delay.toFixed(2)}
  });`;
}

/**
 * Generate custom animations
 */
function generateCustomAnimation(selector: string, element: AnimationElement, delay: number, options: CodeGeneratorOptions): string {
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `tl.to("${selector}", {
    // Add your custom animation properties here
    transformOrigin: "${transformOrigin}",
    duration: ${options.duration},
    ease: "${options.easing}",
    delay: ${delay.toFixed(2)}
  });`;
}

/**
 * Generate GSAP-specific CSS
 */
function generateGSAPCSS(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const css = `/* GSAP Animation Styles */
.svg-container {
  width: 100%;
  max-width: 800px;
  height: auto;
  ${options.responsive ? 'max-width: 100%;' : ''}
}

.svg-container svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Element-specific transform origins */
${elements.map(element => {
  const pivot = element.pivot;
  if (!pivot) return '';
  return `#${element.id} {
  transform-origin: ${pivot.transformOrigin};
  transform-box: fill-box;
}`;
}).filter(Boolean).join('\n')}

/* Responsive behavior */
@media (max-width: 768px) {
  .svg-container {
    max-width: 100%;
    padding: 1rem;
  }
}`;

  return css;
}

/**
 * Generate GSAP event handlers
 */
function generateGSAPEventHandlers(options: CodeGeneratorOptions): string {
  switch (options.animationType) {
    case 'hover':
      return '// Hover events are handled in individual element animations above';
    case 'click':
      return `// Click handler example
  document.querySelector('.svg-container').addEventListener('click', () => {
    animation.restart();
  });`;
    default:
      return '// Animation starts automatically';
  }
}

/**
 * Generate GSAP helper functions
 */
function generateGSAPHelperFunctions(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  return `
// Helper functions for animation control
function pauseAnimation(animation) {
  animation.pause();
}

function playAnimation(animation) {
  animation.play();
}

function restartAnimation(animation) {
  animation.restart();
}

function setAnimationProgress(animation, progress) {
  animation.progress(progress);
}

${options.includeComments ? '// Export for external control' : ''}
window.svgAnimation = {
  pause: () => pauseAnimation(window.currentAnimation),
  play: () => playAnimation(window.currentAnimation),
  restart: () => restartAnimation(window.currentAnimation),
  setProgress: (progress) => setAnimationProgress(window.currentAnimation, progress)
};`;
}

/**
 * Generate HTML preview
 */
function generateGSAPPreview(svgContent: string, elements: AnimationElement[], options: CodeGeneratorOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GSAP SVG Animation Preview</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  ${options.animationType === 'scroll' ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>' : ''}
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .svg-container { max-width: 800px; margin: 0 auto; }
    .controls { text-align: center; margin: 20px 0; }
    button { margin: 0 10px; padding: 10px 20px; }
  </style>
</head>
<body>
  <div class="svg-container">
    ${svgContent}
  </div>
  
  <div class="controls">
    <button onclick="window.svgAnimation.play()">Play</button>
    <button onclick="window.svgAnimation.pause()">Pause</button>
    <button onclick="window.svgAnimation.restart()">Restart</button>
  </div>

  <script>
    // Generated GSAP code would go here
    console.log('GSAP animation preview loaded');
  </script>
</body>
</html>`;
}

/**
 * CSS Keyframes Code Generator
 */
export function generateCSSCode(
  svgContent: string,
  elements: AnimationElement[],
  pivotPoints: PivotPoint[],
  options: CodeGeneratorOptions
): GeneratedCode {
  const elementsWithPivots = elements.map(element => ({
    ...element,
    pivot: pivotPoints.find(p => p.elementId === element.id)
  }));

  const keyframes = generateCSSKeyframes(elementsWithPivots, options);
  const css = generateCSSAnimations(elementsWithPivots, options);

  const code = `/* CSS Animation Styles */
${keyframes}

${css}

/* Animation trigger classes */
.animate-entrance #svg-root * {
  animation-play-state: running;
}

.animate-paused #svg-root * {
  animation-play-state: paused;
}

${options.responsive ? generateResponsiveCSS() : ''}`;

  return {
    code,
    css: code,
    imports: [],
    dependencies: [],
    instructions: `
## CSS Animation Setup

1. **Add the generated CSS** to your stylesheet
2. **Include the SVG** with id="svg-root"
3. **Add animation trigger classes** to control playback
4. **Customize keyframes** for different effects

## Usage Tips
- Use \`.animate-entrance\` class to trigger animations
- Adjust \`animation-duration\` and \`animation-delay\` values
- Add \`animation-fill-mode: both\` for persistent end states
- Use \`prefers-reduced-motion\` for accessibility
`,
    preview: generateCSSPreview(svgContent, elementsWithPivots, options)
  };
}

/**
 * Generate CSS keyframes
 */
function generateCSSKeyframes(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const keyframes: string[] = [];

  switch (options.animationType) {
    case 'entrance':
      keyframes.push(`
@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}`);
      break;
    
    case 'loop':
      keyframes.push(`
@keyframes rotateLoop {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`);
      break;

    case 'hover':
      keyframes.push(`
@keyframes scaleHover {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}`);
      break;

    case 'drawon':
      keyframes.push(`
@keyframes drawOn {
  from { stroke-dashoffset: var(--path-length); }
  to { stroke-dashoffset: 0; }
}`);
      break;
  }

  return keyframes.join('\n');
}

/**
 * Generate CSS animations
 */
function generateCSSAnimations(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const stagger = options.stagger || 0.1;
  const animations: string[] = [];

  elements.forEach((element, index) => {
    const delay = index * stagger;
    const pivot = element.pivot;
    const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
    
    let animationName = '';
    switch (options.animationType) {
      case 'entrance': animationName = 'fadeInScale'; break;
      case 'loop': animationName = 'rotateLoop'; break;
      case 'hover': animationName = 'scaleHover'; break;
      case 'drawon': 
        animationName = 'drawOn';
        // Set up stroke-dasharray for draw-on animation
        if (element.pathLength) {
          const pathLength = Math.ceil(element.pathLength);
          animations.push(`
#${element.id} {
  --path-length: ${pathLength};
  stroke-dasharray: ${pathLength};
  stroke-dashoffset: ${pathLength};
  transform-origin: ${transformOrigin};
  transform-box: fill-box;
  animation: ${animationName} ${options.duration}s ${options.easing} ${delay.toFixed(2)}s both;
}`);
          return; // Skip the standard animation setup below
        }
        break;
      default: animationName = 'fadeInScale';
    }

    animations.push(`
#${element.id} {
  transform-origin: ${transformOrigin};
  transform-box: fill-box;
  animation: ${animationName} ${options.duration}s ${options.easing} ${delay.toFixed(2)}s both;
  ${options.animationType === 'loop' ? 'animation-iteration-count: infinite;' : ''}
  ${options.animationType === 'hover' ? 'animation-play-state: paused;' : ''}
}

${options.animationType === 'hover' ? `
#${element.id}:hover {
  animation-play-state: running;
}` : ''}`);
  });

  return animations.join('\n');
}

/**
 * Generate responsive CSS
 */
function generateResponsiveCSS(): string {
  return `
/* Responsive design */
@media (max-width: 768px) {
  #svg-root {
    max-width: 100%;
    height: auto;
  }
  
  #svg-root * {
    animation-duration: 0.8s !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  #svg-root * {
    animation: none !important;
  }
}`;
}

/**
 * Generate CSS preview
 */
function generateCSSPreview(svgContent: string, elements: AnimationElement[], options: CodeGeneratorOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS SVG Animation Preview</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .svg-container { max-width: 800px; margin: 0 auto; }
    .controls { text-align: center; margin: 20px 0; }
    button { margin: 0 10px; padding: 10px 20px; }
    
    /* Animation styles would be inserted here */
  </style>
</head>
<body>
  <div class="svg-container animate-entrance">
    ${svgContent}
  </div>
  
  <div class="controls">
    <button onclick="document.querySelector('.svg-container').classList.toggle('animate-entrance')">Toggle Animation</button>
    <button onclick="document.querySelector('.svg-container').classList.toggle('animate-paused')">Pause/Resume</button>
  </div>
</body>
</html>`;
}

/**
 * Web Animations API Code Generator
 */
export function generateWAAPICode(
  svgContent: string,
  elements: AnimationElement[],
  pivotPoints: PivotPoint[],
  options: CodeGeneratorOptions
): GeneratedCode {
  const elementsWithPivots = elements.map(element => ({
    ...element,
    pivot: pivotPoints.find(p => p.elementId === element.id)
  }));

  const code = generateWAAPIJavaScript(elementsWithPivots, options);
  const css = generateWAAPICSS(elementsWithPivots, options);

  return {
    code,
    css,
    imports: [],
    dependencies: [],
    instructions: `
## Web Animations API Setup

1. **Add the generated JavaScript** to your page
2. **Include the CSS** for transform origins
3. **Call \`initWebAnimations()\`** when DOM is ready
4. **Modern browsers only** - check compatibility

## Usage Tips
- Native browser performance
- Good mobile support
- Use \`animation.pause()\` and \`animation.play()\` for control
- Combine with IntersectionObserver for scroll triggers
`,
    preview: generateWAAPIPreview(svgContent, elementsWithPivots, options)
  };
}

/**
 * Generate Web Animations API JavaScript
 */
function generateWAAPIJavaScript(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const stagger = options.stagger || 100; // in milliseconds
  
  return `// Web Animations API SVG Animation
function initWebAnimations() {
  const animations = [];

${elements.map((element, index) => {
  const delay = index * stagger;
  const pivot = element.pivot;
  const transformOrigin = pivot ? pivot.transformOrigin : '50% 50%';
  
  return `  // Animation for ${element.id}
  const element${index} = document.querySelector('#${element.id}');
  if (element${index}) {
    element${index}.style.transformOrigin = '${transformOrigin}';
    element${index}.style.transformBox = 'fill-box';
    
    const animation${index} = element${index}.animate([
      ${generateWAAPIKeyframes(options)}
    ], {
      duration: ${options.duration * 1000}, // milliseconds
      delay: ${delay},
      easing: '${convertEasingToCSS(options.easing)}',
      fill: 'both',
      ${options.animationType === 'loop' ? 'iterations: Infinity,' : ''}
    });
    
    animations.push(animation${index});
  }`;
}).join('\n\n')}

  return animations;
}

// Animation control functions
let currentAnimations = [];

function startAnimations() {
  currentAnimations = initWebAnimations();
  return currentAnimations;
}

function pauseAnimations() {
  currentAnimations.forEach(anim => anim.pause());
}

function playAnimations() {
  currentAnimations.forEach(anim => anim.play());
}

function restartAnimations() {
  currentAnimations.forEach(anim => {
    anim.cancel();
    anim.play();
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', startAnimations);

// Export for external control
window.webAnimations = {
  start: startAnimations,
  pause: pauseAnimations,
  play: playAnimations,
  restart: restartAnimations
};`;
}

/**
 * Generate WAAPI keyframes
 */
function generateWAAPIKeyframes(options: CodeGeneratorOptions): string {
  switch (options.animationType) {
    case 'entrance':
      return `{ opacity: 0, transform: 'scale(0.3) rotate(-180deg)' },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' }`;
    
    case 'loop':
      return `{ transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }`;
    
    case 'hover':
      return `{ transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.1) rotate(5deg)' },
      { transform: 'scale(1) rotate(0deg)' }`;
    
    default:
      return `{ opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }`;
  }
}

/**
 * Generate WAAPI CSS
 */
function generateWAAPICSS(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  return `/* Web Animations API Styles */
.svg-container {
  width: 100%;
  max-width: 800px;
  height: auto;
}

.svg-container svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Transform origins will be set via JavaScript */
${elements.map(element => `#${element.id} { transform-box: fill-box; }`).join('\n')}

${options.responsive ? generateResponsiveCSS() : ''}`;
}

/**
 * Generate WAAPI preview
 */
function generateWAAPIPreview(svgContent: string, elements: AnimationElement[], options: CodeGeneratorOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Animations API Preview</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .svg-container { max-width: 800px; margin: 0 auto; }
    .controls { text-align: center; margin: 20px 0; }
    button { margin: 0 10px; padding: 10px 20px; }
  </style>
</head>
<body>
  <div class="svg-container">
    ${svgContent}
  </div>
  
  <div class="controls">
    <button onclick="window.webAnimations.play()">Play</button>
    <button onclick="window.webAnimations.pause()">Pause</button>
    <button onclick="window.webAnimations.restart()">Restart</button>
  </div>

  <script>
    // Generated Web Animations API code would go here
  </script>
</body>
</html>`;
}

/**
 * Convert GSAP easing to CSS easing
 */
function convertEasingToCSS(easing: string): string {
  const easingMap: Record<string, string> = {
    'power2.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'power2.in': 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
    'power2.inOut': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    'back.out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'elastic.out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'bounce.out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'none': 'linear'
  };
  
  return easingMap[easing] || 'ease-out';
}

/**
 * Generate React component with animations
 */
export function generateReactCode(elements: AnimationElement[], options: CodeGeneratorOptions): string {
  const componentName = 'AnimatedSVG';
  
  return `import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface ${componentName}Props {
  className?: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  svgContent: string;
  respectReducedMotion?: boolean;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  className = '', 
  autoPlay = true,
  onComplete,
  svgContent,
  respectReducedMotion = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for performance
  useEffect(() => {
    if (!svgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !isVisible) return;

    // Respect reduced motion preference
    const prefersReducedMotion = 
      respectReducedMotion && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      ${elements.map(el => `gsap.set("#${el.id}", { opacity: 1 });`).join('\n      ')}
      onComplete?.();
      return;
    }

    // Create animation timeline
    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete
    });

${generateGSAPAnimations(elements, options).split('\n').map(line => `    ${line}`).join('\n')}

    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [autoPlay, onComplete, isVisible]);

  return (
    <div className={\`animated-svg-container \${className}\`}>
      <div 
        dangerouslySetInnerHTML={{ __html: svgContent }}
        ref={(el) => {
          const svgElement = el?.querySelector('svg');
          if (svgElement) {
            (svgRef as any).current = svgElement;
          }
        }}
      />
      
      <style jsx>{\`
        .animated-svg-container { display: inline-block; position: relative; }
        
        @media (prefers-reduced-motion: reduce) {
          .animated-svg-container * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      \`}</style>
    </div>
  );
};

export default \${componentName};\`;