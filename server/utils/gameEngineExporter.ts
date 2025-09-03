/**
 * Game Engine Export Utilities
 * Export SVG animations to Unity, Godot, Unreal Engine formats
 */

export interface GameEngineRig {
  metadata: {
    version: string;
    engine: 'unity' | 'godot' | 'unreal' | 'generic';
    exported: string;
    frameRate: number;
    duration: number;
  };
  svg: {
    viewBox: { x: number; y: number; width: number; height: number };
    elements: GameEngineElement[];
  };
  animations: GameEngineAnimation[];
  timeline: GameEngineTimeline;
}

export interface GameEngineElement {
  id: string;
  type: 'path' | 'circle' | 'rect' | 'polygon' | 'group';
  name: string;
  transform: {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    pivot: { x: number; y: number };
  };
  properties: Record<string, any>;
  children?: string[]; // IDs of child elements
}

export interface GameEngineAnimation {
  id: string;
  name: string;
  targetElement: string;
  property: 'position' | 'rotation' | 'scale' | 'opacity' | 'color' | 'path';
  keyframes: GameEngineKeyframe[];
  loop: boolean;
  duration: number;
  easing: string;
}

export interface GameEngineKeyframe {
  time: number; // 0-1 normalized time
  value: any;
  easing?: string;
}

export interface GameEngineTimeline {
  duration: number;
  tracks: Array<{
    elementId: string;
    animations: string[]; // Animation IDs
  }>;
}

/**
 * Export SVG animations to Unity format
 */
export function exportToUnity(
  svgContent: string, 
  animationData: any
): GameEngineRig {
  console.log('Exporting to Unity format...');
  
  const rig: GameEngineRig = {
    metadata: {
      version: '1.0',
      engine: 'unity',
      exported: new Date().toISOString(),
      frameRate: 60,
      duration: animationData.duration || 3
    },
    svg: {
      viewBox: extractViewBox(svgContent),
      elements: extractElements(svgContent, 'unity')
    },
    animations: generateUnityAnimations(animationData),
    timeline: generateTimeline(animationData)
  };

  console.log(`Unity rig exported with ${rig.svg.elements.length} elements and ${rig.animations.length} animations`);
  return rig;
}

/**
 * Export SVG animations to Godot format
 */
export function exportToGodot(
  svgContent: string, 
  animationData: any
): GameEngineRig {
  console.log('Exporting to Godot format...');
  
  const rig: GameEngineRig = {
    metadata: {
      version: '1.0',
      engine: 'godot',
      exported: new Date().toISOString(),
      frameRate: 60,
      duration: animationData.duration || 3
    },
    svg: {
      viewBox: extractViewBox(svgContent),
      elements: extractElements(svgContent, 'godot')
    },
    animations: generateGodotAnimations(animationData),
    timeline: generateTimeline(animationData)
  };

  console.log(`Godot rig exported with ${rig.svg.elements.length} elements and ${rig.animations.length} animations`);
  return rig;
}

/**
 * Export SVG animations to generic JSON format
 */
export function exportToGenericJSON(
  svgContent: string, 
  animationData: any
): GameEngineRig {
  console.log('Exporting to generic JSON format...');
  
  const rig: GameEngineRig = {
    metadata: {
      version: '1.0',
      engine: 'generic',
      exported: new Date().toISOString(),
      frameRate: 60,
      duration: animationData.duration || 3
    },
    svg: {
      viewBox: extractViewBox(svgContent),
      elements: extractElements(svgContent, 'generic')
    },
    animations: generateGenericAnimations(animationData),
    timeline: generateTimeline(animationData)
  };

  console.log(`Generic JSON rig exported with ${rig.svg.elements.length} elements and ${rig.animations.length} animations`);
  return rig;
}

/**
 * Extract viewBox from SVG
 */
function extractViewBox(svgContent: string): { x: number; y: number; width: number; height: number } {
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  if (viewBoxMatch) {
    const values = viewBoxMatch[1].split(/\s+/).map(v => parseFloat(v));
    return {
      x: values[0] || 0,
      y: values[1] || 0,
      width: values[2] || 100,
      height: values[3] || 100
    };
  }
  return { x: 0, y: 0, width: 100, height: 100 };
}

/**
 * Extract elements from SVG for game engine
 */
function extractElements(svgContent: string, engine: string): GameEngineElement[] {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'text/xml');
    const elements: GameEngineElement[] = [];
    
    const svgElements = svgDoc.querySelectorAll('path, circle, rect, ellipse, polygon, line, g');
    
    Array.from(svgElements).forEach(element => {
      const id = element.getAttribute('id') || `element_${elements.length}`;
      const transform = parseTransform(element.getAttribute('transform') || '');
      
      elements.push({
        id,
        type: element.tagName.toLowerCase() as any,
        name: generateElementName(element, id),
        transform,
        properties: extractElementProperties(element, engine),
        children: element.tagName === 'g' ? 
          Array.from(element.children).map(child => child.getAttribute('id') || `child_${Math.random()}`) :
          undefined
      });
    });
    
    return elements;
  } catch (error) {
    console.error('Error extracting elements:', error);
    return [];
  }
}

/**
 * Parse SVG transform attribute
 */
function parseTransform(transformStr: string): GameEngineElement['transform'] {
  const transform = {
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    pivot: { x: 0, y: 0 }
  };

  if (!transformStr) return transform;

  // Parse translate
  const translateMatch = transformStr.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const values = translateMatch[1].split(/[,\s]+/).map(v => parseFloat(v));
    transform.position.x = values[0] || 0;
    transform.position.y = values[1] || 0;
  }

  // Parse rotate
  const rotateMatch = transformStr.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    const values = rotateMatch[1].split(/[,\s]+/).map(v => parseFloat(v));
    transform.rotation = values[0] || 0;
    if (values.length >= 3) {
      transform.pivot.x = values[1] || 0;
      transform.pivot.y = values[2] || 0;
    }
  }

  // Parse scale
  const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const values = scaleMatch[1].split(/[,\s]+/).map(v => parseFloat(v));
    transform.scale.x = values[0] || 1;
    transform.scale.y = values[1] || values[0] || 1;
  }

  return transform;
}

/**
 * Generate human-readable element name
 */
function generateElementName(element: Element, id: string): string {
  // Try to get semantic name from class or data attributes
  const className = element.getAttribute('class');
  if (className && className.includes('wheel')) return 'Wheel';
  if (className && className.includes('body')) return 'Body';
  if (className && className.includes('eye')) return 'Eye';
  
  // Generate based on element type and properties
  const tagName = element.tagName.toLowerCase();
  const fill = element.getAttribute('fill');
  const stroke = element.getAttribute('stroke');
  
  let name = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  
  if (fill && fill !== 'none') {
    name = `${getColorName(fill)} ${name}`;
  } else if (stroke && stroke !== 'none') {
    name = `${getColorName(stroke)} ${name}`;
  }
  
  return name || cleanId(id);
}

/**
 * Get color name from hex/rgb value
 */
function getColorName(color: string): string {
  const colorMap: Record<string, string> = {
    '#ff0000': 'Red', '#f00': 'Red',
    '#00ff00': 'Green', '#0f0': 'Green',
    '#0000ff': 'Blue', '#00f': 'Blue',
    '#ffff00': 'Yellow', '#ff0': 'Yellow',
    '#ff00ff': 'Purple', '#f0f': 'Purple',
    '#00ffff': 'Cyan', '#0ff': 'Cyan',
    '#000000': 'Black', '#000': 'Black',
    '#ffffff': 'White', '#fff': 'White'
  };
  
  return colorMap[color.toLowerCase()] || '';
}

/**
 * Clean ID for display
 */
function cleanId(id: string): string {
  return id.replace(/^(anim_|path_|rect_|circle_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extract element properties for game engine
 */
function extractElementProperties(element: Element, engine: string): Record<string, any> {
  const properties: Record<string, any> = {};
  
  // Common properties
  const fill = element.getAttribute('fill');
  const stroke = element.getAttribute('stroke');
  const strokeWidth = element.getAttribute('stroke-width');
  const opacity = element.getAttribute('opacity');
  
  if (fill && fill !== 'none') properties.fill = fill;
  if (stroke && stroke !== 'none') properties.stroke = stroke;
  if (strokeWidth) properties.strokeWidth = parseFloat(strokeWidth);
  if (opacity) properties.opacity = parseFloat(opacity);
  
  // Path-specific properties
  if (element.tagName === 'path') {
    const d = element.getAttribute('d');
    if (d) properties.pathData = d;
  }
  
  // Circle properties
  if (element.tagName === 'circle') {
    const r = element.getAttribute('r');
    const cx = element.getAttribute('cx');
    const cy = element.getAttribute('cy');
    if (r) properties.radius = parseFloat(r);
    if (cx) properties.centerX = parseFloat(cx);
    if (cy) properties.centerY = parseFloat(cy);
  }
  
  // Rectangle properties
  if (element.tagName === 'rect') {
    const width = element.getAttribute('width');
    const height = element.getAttribute('height');
    const x = element.getAttribute('x');
    const y = element.getAttribute('y');
    if (width) properties.width = parseFloat(width);
    if (height) properties.height = parseFloat(height);
    if (x) properties.x = parseFloat(x);
    if (y) properties.y = parseFloat(y);
  }
  
  return properties;
}

/**
 * Generate Unity-specific animations
 */
function generateUnityAnimations(animationData: any): GameEngineAnimation[] {
  const animations: GameEngineAnimation[] = [];
  
  // Example animations - in real implementation, this would parse actual animation data
  animations.push({
    id: 'spin_animation',
    name: 'Spin Rotation',
    targetElement: 'wheel_element',
    property: 'rotation',
    duration: 2,
    loop: true,
    easing: 'linear',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1, value: 360 }
    ]
  });
  
  return animations;
}

/**
 * Generate Godot-specific animations
 */
function generateGodotAnimations(animationData: any): GameEngineAnimation[] {
  const animations: GameEngineAnimation[] = [];
  
  // Godot uses different coordinate system and naming conventions
  animations.push({
    id: 'godot_spin',
    name: 'rotation_degrees',
    targetElement: 'wheel_element',
    property: 'rotation',
    duration: 2,
    loop: true,
    easing: 'linear',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1, value: 360 }
    ]
  });
  
  return animations;
}

/**
 * Generate generic animations
 */
function generateGenericAnimations(animationData: any): GameEngineAnimation[] {
  const animations: GameEngineAnimation[] = [];
  
  // Generic format compatible with most engines
  animations.push({
    id: 'generic_spin',
    name: 'Spin Animation',
    targetElement: 'animated_element',
    property: 'rotation',
    duration: 2,
    loop: true,
    easing: 'linear',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1, value: 360 }
    ]
  });
  
  return animations;
}

/**
 * Generate timeline data
 */
function generateTimeline(animationData: any): GameEngineTimeline {
  return {
    duration: animationData.duration || 3,
    tracks: [
      {
        elementId: 'animated_element',
        animations: ['spin_animation']
      }
    ]
  };
}

/**
 * Generate Unity C# script for the animation rig
 */
export function generateUnityCSharpScript(rig: GameEngineRig): string {
  return `using UnityEngine;
using System.Collections;

[System.Serializable]
public class SVGAnimationRig : MonoBehaviour 
{
    [Header("Animation Settings")]
    public float duration = ${rig.metadata.duration}f;
    public bool autoPlay = true;
    public bool loop = true;
    
    [Header("SVG Elements")]
    ${rig.svg.elements.map(element => 
      `public Transform ${element.name.replace(/\s/g, '')}Transform;`
    ).join('\n    ')}
    
    private Coroutine animationCoroutine;
    
    void Start()
    {
        if (autoPlay)
        {
            PlayAnimation();
        }
    }
    
    public void PlayAnimation()
    {
        if (animationCoroutine != null)
        {
            StopCoroutine(animationCoroutine);
        }
        animationCoroutine = StartCoroutine(AnimateElements());
    }
    
    public void StopAnimation()
    {
        if (animationCoroutine != null)
        {
            StopCoroutine(animationCoroutine);
            animationCoroutine = null;
        }
    }
    
    IEnumerator AnimateElements()
    {
        float elapsedTime = 0f;
        
        ${rig.svg.elements.map(element => {
          const transformVar = element.name.replace(/\s/g, '');
          return `Vector3 ${transformVar}StartPos = ${transformVar}Transform.position;
        Vector3 ${transformVar}StartRot = ${transformVar}Transform.eulerAngles;`;
        }).join('\n        ')}
        
        while (elapsedTime < duration)
        {
            float progress = elapsedTime / duration;
            
            ${rig.animations.map(animation => {
              const elementName = rig.svg.elements.find(e => e.id === animation.targetElement)?.name.replace(/\s/g, '') || 'Element';
              
              switch (animation.property) {
                case 'rotation':
                  return `// ${animation.name}
            ${elementName}Transform.rotation = Quaternion.Euler(0, 0, ${animation.keyframes[1].value}f * progress);`;
                case 'position':
                  return `// ${animation.name}
            ${elementName}Transform.position = Vector3.Lerp(${elementName}StartPos, ${elementName}StartPos + new Vector3(${animation.keyframes[1].value}, 0, 0), progress);`;
                default:
                  return `// ${animation.name} - Custom property`;
              }
            }).join('\n            ')}
            
            elapsedTime += Time.deltaTime;
            yield return null;
        }
        
        if (loop)
        {
            animationCoroutine = StartCoroutine(AnimateElements());
        }
    }
}`;
}

/**
 * Generate Godot GDScript for the animation rig
 */
export function generateGodotScript(rig: GameEngineRig): string {
  return `extends Node2D
class_name SVGAnimationRig

# Animation settings
export var duration: float = ${rig.metadata.duration}
export var auto_play: bool = true
export var loop: bool = true

# SVG element references
${rig.svg.elements.map(element => 
  `export var ${element.name.replace(/\s/g, '').toLowerCase()}_node: Node2D`
).join('\n')}

var tween: SceneTreeTween

func _ready():
    if auto_play:
        play_animation()

func play_animation():
    if tween:
        tween.kill()
    
    tween = create_tween()
    tween.set_loops() if loop else tween
    
    ${rig.animations.map(animation => {
      const elementName = rig.svg.elements.find(e => e.id === animation.targetElement)?.name.replace(/\s/g, '').toLowerCase() || 'element';
      
      switch (animation.property) {
        case 'rotation':
          return `# ${animation.name}
    tween.parallel().tween_property(${elementName}_node, "rotation_degrees", ${animation.keyframes[1].value}, duration)`;
        case 'position':
          return `# ${animation.name}
    tween.parallel().tween_property(${elementName}_node, "position", Vector2(${animation.keyframes[1].value}, 0), duration)`;
        default:
          return `# ${animation.name} - Custom property`;
      }
    }).join('\n    ')}

func stop_animation():
    if tween:
        tween.kill()

func pause_animation():
    if tween:
        tween.pause()

func resume_animation():
    if tween:
        tween.play()`;
}