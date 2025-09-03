/**
 * One-Click Animation Templates
 * Pre-built animation patterns for common use cases
 */

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'motion' | 'attention' | 'entrance' | 'exit' | 'special';
  duration: number;
  easing: string;
  applies: 'single' | 'multiple' | 'group';
  preview: string;
  gsapCode: (elementId: string) => string;
  cssCode: (elementId: string) => string;
  wapiCode: (elementId: string) => string;
}

/**
 * Pre-built animation templates
 */
export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  // MOTION TEMPLATES
  {
    id: 'spin-wheel',
    name: 'Spinning Wheel',
    description: 'Continuous rotation - perfect for loading spinners, wheels, gears',
    category: 'motion',
    duration: 2,
    easing: 'linear',
    applies: 'single',
    preview: '↻ Continuous 360° rotation',
    gsapCode: (elementId: string) => `
gsap.to("#${elementId}", {
  rotation: 360,
  duration: 2,
  ease: "none",
  repeat: -1
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: spin-wheel 2s linear infinite;
}

@keyframes spin-wheel {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(360deg)' }
], {
  duration: 2000,
  iterations: Infinity,
  easing: 'linear'
});`
  },

  {
    id: 'floating-bob',
    name: 'Floating Bob',
    description: 'Gentle up and down movement - great for floating elements, clouds, bubbles',
    category: 'motion',
    duration: 3,
    easing: 'sine.inOut',
    applies: 'single',
    preview: '↕ Smooth vertical floating motion',
    gsapCode: (elementId: string) => `
gsap.to("#${elementId}", {
  y: -20,
  duration: 3,
  ease: "sine.inOut",
  repeat: -1,
  yoyo: true
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: floating-bob 3s ease-in-out infinite alternate;
}

@keyframes floating-bob {
  from { transform: translateY(0px); }
  to { transform: translateY(-20px); }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'translateY(0px)' },
  { transform: 'translateY(-20px)' }
], {
  duration: 3000,
  iterations: Infinity,
  direction: 'alternate',
  easing: 'ease-in-out'
});`
  },

  {
    id: 'gentle-sway',
    name: 'Gentle Sway',
    description: 'Subtle side-to-side movement - perfect for leaves, flags, hanging objects',
    category: 'motion',
    duration: 4,
    easing: 'sine.inOut',
    applies: 'single',
    preview: '↔ Subtle horizontal swaying motion',
    gsapCode: (elementId: string) => `
gsap.to("#${elementId}", {
  rotation: 5,
  duration: 4,
  ease: "sine.inOut",
  repeat: -1,
  yoyo: true
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: gentle-sway 4s ease-in-out infinite alternate;
}

@keyframes gentle-sway {
  from { transform: rotate(-5deg); }
  to { transform: rotate(5deg); }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'rotate(-5deg)' },
  { transform: 'rotate(5deg)' }
], {
  duration: 4000,
  iterations: Infinity,
  direction: 'alternate',
  easing: 'ease-in-out'
});`
  },

  // ATTENTION TEMPLATES
  {
    id: 'pulse-attention',
    name: 'Pulse Attention',
    description: 'Scale pulse to grab attention - ideal for CTAs, notifications, important elements',
    category: 'attention',
    duration: 1.5,
    easing: 'power2.inOut',
    applies: 'single',
    preview: '⬡ Rhythmic scale pulsing',
    gsapCode: (elementId: string) => `
gsap.to("#${elementId}", {
  scale: 1.1,
  duration: 1.5,
  ease: "power2.inOut",
  repeat: -1,
  yoyo: true
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: pulse-attention 1.5s ease-in-out infinite alternate;
}

@keyframes pulse-attention {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'scale(1)' },
  { transform: 'scale(1.1)' }
], {
  duration: 1500,
  iterations: Infinity,
  direction: 'alternate',
  easing: 'ease-in-out'
});`
  },

  {
    id: 'glow-blink',
    name: 'Glow Blink',
    description: 'Opacity blink effect - perfect for indicators, status lights, alerts',
    category: 'attention',
    duration: 1,
    easing: 'power2.inOut',
    applies: 'single',
    preview: '💡 Smooth opacity fade in/out',
    gsapCode: (elementId: string) => `
gsap.to("#${elementId}", {
  opacity: 0.3,
  duration: 1,
  ease: "power2.inOut",
  repeat: -1,
  yoyo: true
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: glow-blink 1s ease-in-out infinite alternate;
}

@keyframes glow-blink {
  from { opacity: 1; }
  to { opacity: 0.3; }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { opacity: 1 },
  { opacity: 0.3 }
], {
  duration: 1000,
  iterations: Infinity,
  direction: 'alternate',
  easing: 'ease-in-out'
});`
  },

  {
    id: 'wiggle-shake',
    name: 'Wiggle Shake',
    description: 'Quick shake movement - great for error states, invalid inputs, emphasis',
    category: 'attention',
    duration: 0.5,
    easing: 'power2.out',
    applies: 'single',
    preview: '📳 Rapid side-to-side shake',
    gsapCode: (elementId: string) => `
gsap.fromTo("#${elementId}", {
  x: 0
}, {
  x: -10,
  duration: 0.1,
  ease: "power2.out",
  yoyo: true,
  repeat: 5
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  animation: wiggle-shake 0.5s ease-out;
}

@keyframes wiggle-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'translateX(0px)' },
  { transform: 'translateX(-10px)' },
  { transform: 'translateX(10px)' },
  { transform: 'translateX(-10px)' },
  { transform: 'translateX(10px)' },
  { transform: 'translateX(0px)' }
], {
  duration: 500,
  easing: 'ease-out'
});`
  },

  // ENTRANCE TEMPLATES
  {
    id: 'draw-in-stroke',
    name: 'Draw In (Stroke)',
    description: 'Path drawing animation - perfect for line art, signatures, illustrations',
    category: 'entrance',
    duration: 2,
    easing: 'power2.out',
    applies: 'single',
    preview: '✏ Progressive path drawing',
    gsapCode: (elementId: string) => `
// Requires path with stroke and data-length attribute
const pathLength = document.querySelector("#${elementId}").getAttribute('data-length');
gsap.fromTo("#${elementId}", {
  strokeDasharray: pathLength,
  strokeDashoffset: pathLength
}, {
  strokeDashoffset: 0,
  duration: 2,
  ease: "power2.out"
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw-in-stroke 2s ease-out forwards;
}

@keyframes draw-in-stroke {
  to { stroke-dashoffset: 0; }
}`,
    wapiCode: (elementId: string) => `
const element = document.querySelector('#${elementId}');
const pathLength = element.getAttribute('data-length');
element.animate([
  { strokeDasharray: pathLength, strokeDashoffset: pathLength },
  { strokeDasharray: pathLength, strokeDashoffset: 0 }
], {
  duration: 2000,
  easing: 'ease-out',
  fill: 'forwards'
});`
  },

  {
    id: 'fade-in-up',
    name: 'Fade In Up',
    description: 'Fade in with upward movement - classic entrance animation',
    category: 'entrance',
    duration: 1,
    easing: 'power2.out',
    applies: 'multiple',
    preview: '↗ Fade in while moving up',
    gsapCode: (elementId: string) => `
gsap.fromTo("#${elementId}", {
  opacity: 0,
  y: 50
}, {
  opacity: 1,
  y: 0,
  duration: 1,
  ease: "power2.out"
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  opacity: 0;
  transform: translateY(50px);
  animation: fade-in-up 1s ease-out forwards;
}

@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { opacity: 0, transform: 'translateY(50px)' },
  { opacity: 1, transform: 'translateY(0px)' }
], {
  duration: 1000,
  easing: 'ease-out',
  fill: 'forwards'
});`
  },

  {
    id: 'scale-in-bounce',
    name: 'Scale In Bounce',
    description: 'Bouncy scale entrance - playful and attention-grabbing',
    category: 'entrance',
    duration: 0.8,
    easing: 'back.out(1.7)',
    applies: 'single',
    preview: '⚡ Bouncy scale appearance',
    gsapCode: (elementId: string) => `
gsap.fromTo("#${elementId}", {
  scale: 0,
  opacity: 0
}, {
  scale: 1,
  opacity: 1,
  duration: 0.8,
  ease: "back.out(1.7)"
});`,
    cssCode: (elementId: string) => `
#${elementId} {
  transform: scale(0);
  opacity: 0;
  animation: scale-in-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes scale-in-bounce {
  to {
    transform: scale(1);
    opacity: 1;
  }
}`,
    wapiCode: (elementId: string) => `
document.querySelector('#${elementId}').animate([
  { transform: 'scale(0)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1 }
], {
  duration: 800,
  easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  fill: 'forwards'
});`
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AnimationTemplate['category']): AnimationTemplate[] {
  return ANIMATION_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AnimationTemplate | undefined {
  return ANIMATION_TEMPLATES.find(template => template.id === id);
}

/**
 * Apply template to SVG element
 */
export function applyTemplate(
  templateId: string,
  elementId: string,
  framework: 'gsap' | 'css' | 'waapi' = 'gsap'
): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  switch (framework) {
    case 'gsap':
      return template.gsapCode(elementId);
    case 'css':
      return template.cssCode(elementId);
    case 'waapi':
      return template.wapiCode(elementId);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

/**
 * Generate staggered template animations for multiple elements
 */
export function generateStaggeredTemplate(
  templateId: string,
  elementIds: string[],
  staggerDelay: number = 0.1,
  framework: 'gsap' | 'css' | 'waapi' = 'gsap'
): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  if (framework === 'gsap') {
    return `// Staggered ${template.name} Animation
const tl = gsap.timeline();

${elementIds.map((elementId, index) => {
  const delay = index * staggerDelay;
  return `tl.add(() => {
  ${template.gsapCode(elementId).replace('gsap.', '').replace(/;$/, '')}
}, ${delay.toFixed(2)});`;
}).join('\n')}

return tl;`;
  } else if (framework === 'css') {
    return `/* Staggered ${template.name} Animation */
${elementIds.map((elementId, index) => {
  const delay = index * staggerDelay;
  return template.cssCode(elementId).replace(/animation:/, `animation-delay: ${delay}s;\n  animation:`);
}).join('\n\n')}`;
  } else {
    return `// Staggered ${template.name} Animation
${elementIds.map((elementId, index) => {
  const delay = index * staggerDelay * 1000; // Convert to milliseconds
  return `setTimeout(() => {
  ${template.wapiCode(elementId)}
}, ${delay});`;
}).join('\n')}`;
  }
}

/**
 * Create template preview HTML
 */
export function generateTemplatePreview(templateId: string, svgContent: string): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} Preview</title>
  <style>
    body { margin: 0; padding: 40px; font-family: Arial, sans-serif; background: #f0f0f0; }
    .preview-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px; 
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .template-info { margin-bottom: 30px; }
    .template-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .template-desc { color: #666; margin-bottom: 20px; }
    .svg-preview { text-align: center; }
    svg { max-width: 400px; max-height: 400px; }
    
    /* Template CSS */
    ${template.cssCode('animated-element')}
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="template-info">
      <div class="template-name">${template.name}</div>
      <div class="template-desc">${template.description}</div>
      <div><strong>Preview:</strong> ${template.preview}</div>
    </div>
    
    <div class="svg-preview">
      ${svgContent.replace(/id="[^"]*"/g, 'id="animated-element"')}
    </div>
  </div>
</body>
</html>`;
}