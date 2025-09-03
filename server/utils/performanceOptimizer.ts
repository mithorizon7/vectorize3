import { JSDOM } from 'jsdom';

/**
 * Performance optimization utilities for animation-ready SVGs
 * Includes complexity analysis, node reduction, and FPS optimization
 */

export interface PerformanceOptions {
  targetComplexity: 'low' | 'medium' | 'high';
  enableNodeReduction: boolean;
  targetReduction: number; // Percentage (e.g., 30 for 30% reduction)
  mergePaths: boolean;
  simplifyPaths: boolean;
  removeRedundantGroups: boolean;
  optimizeForFPS: boolean;
  targetFPS: number; // 60, 30, etc.
}

export interface ComplexityAnalysis {
  totalNodes: number;
  pathNodes: number;
  groupNodes: number;
  complexityScore: number; // 0-100
  complexity: 'low' | 'medium' | 'high';
  estimatedFPS: number;
  recommendations: string[];
  potentialReduction: number; // Percentage
}

export interface OptimizationResult {
  originalSVG: string;
  optimizedSVG: string;
  beforeAnalysis: ComplexityAnalysis;
  afterAnalysis: ComplexityAnalysis;
  reductionAchieved: number; // Percentage
  optimizationsApplied: string[];
}

/**
 * Analyze SVG complexity for animation performance
 */
export function analyzeComplexity(svgContent: string): ComplexityAnalysis {
  try {
    console.log('Analyzing SVG complexity for animation performance...');
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // Count different element types
    const allElements = svgElement.querySelectorAll('*');
    const totalNodes = allElements.length;
    const pathNodes = svgElement.querySelectorAll('path').length;
    const groupNodes = svgElement.querySelectorAll('g').length;
    const circles = svgElement.querySelectorAll('circle').length;
    const rects = svgElement.querySelectorAll('rect').length;
    const polygons = svgElement.querySelectorAll('polygon').length;
    const texts = svgElement.querySelectorAll('text').length;

    // Calculate complexity factors
    let complexityScore = 0;
    
    // Base complexity from element count
    complexityScore += Math.min(totalNodes * 2, 40); // Max 40 points from count
    
    // Path complexity (paths are expensive to animate)
    complexityScore += Math.min(pathNodes * 3, 30); // Max 30 points from paths
    
    // Analyze path data complexity
    let pathDataComplexity = 0;
    svgElement.querySelectorAll('path').forEach(path => {
      const d = path.getAttribute('d');
      if (d) {
        const commands = d.match(/[MLHVCSQTAZ]/gi) || [];
        pathDataComplexity += commands.length;
      }
    });
    complexityScore += Math.min(pathDataComplexity / 10, 20); // Max 20 points from path complexity

    // Nested group penalty
    const maxDepth = calculateMaxNestingDepth(svgElement);
    complexityScore += Math.min(maxDepth * 2, 10); // Max 10 points from nesting
    
    // Determine complexity level
    let complexity: 'low' | 'medium' | 'high';
    if (complexityScore <= 30) {
      complexity = 'low';
    } else if (complexityScore <= 60) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }

    // Estimate FPS based on complexity
    let estimatedFPS: number;
    if (complexityScore <= 20) {
      estimatedFPS = 60;
    } else if (complexityScore <= 40) {
      estimatedFPS = 45;
    } else if (complexityScore <= 60) {
      estimatedFPS = 30;
    } else {
      estimatedFPS = 15;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    let potentialReduction = 0;

    if (pathNodes > 20) {
      recommendations.push(`Reduce path count from ${pathNodes} to ~${Math.ceil(pathNodes * 0.7)}`);
      potentialReduction += 15;
    }

    if (groupNodes > 10) {
      recommendations.push(`Merge redundant groups (${groupNodes} groups found)`);
      potentialReduction += 10;
    }

    if (maxDepth > 4) {
      recommendations.push(`Flatten nested structure (${maxDepth} levels deep)`);
      potentialReduction += 8;
    }

    if (pathDataComplexity > 100) {
      recommendations.push('Simplify complex path curves');
      potentialReduction += 12;
    }

    if (totalNodes > 50) {
      recommendations.push(`Reduce total element count from ${totalNodes}`);
      potentialReduction += 20;
    }

    if (estimatedFPS < 60) {
      recommendations.push(`Optimize for 60fps (currently ~${estimatedFPS}fps)`);
    }

    console.log(`Complexity analysis complete: ${complexity} (${complexityScore}/100)`);

    return {
      totalNodes,
      pathNodes,
      groupNodes,
      complexityScore,
      complexity,
      estimatedFPS,
      recommendations,
      potentialReduction: Math.min(potentialReduction, 50) // Cap at 50%
    };
    
  } catch (error) {
    console.error('Error analyzing complexity:', error);
    return {
      totalNodes: 0,
      pathNodes: 0,
      groupNodes: 0,
      complexityScore: 0,
      complexity: 'low',
      estimatedFPS: 60,
      recommendations: [],
      potentialReduction: 0
    };
  }
}

/**
 * Optimize SVG for animation performance
 */
export function optimizeForAnimation(
  svgContent: string, 
  options: PerformanceOptions
): OptimizationResult {
  try {
    console.log('Optimizing SVG for animation with options:', options);
    
    const beforeAnalysis = analyzeComplexity(svgContent);
    let optimizedSvg = svgContent;
    const optimizationsApplied: string[] = [];

    const dom = new JSDOM(optimizedSvg);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // 1. Remove redundant groups
    if (options.removeRedundantGroups) {
      const removed = removeRedundantGroups(svgElement);
      if (removed > 0) {
        optimizationsApplied.push(`Removed ${removed} redundant groups`);
        console.log(`Removed ${removed} redundant groups`);
      }
    }

    // 2. Merge similar paths
    if (options.mergePaths) {
      const merged = mergeSimilarPaths(svgElement);
      if (merged > 0) {
        optimizationsApplied.push(`Merged ${merged} similar paths`);
        console.log(`Merged ${merged} similar paths`);
      }
    }

    // 3. Simplify complex paths
    if (options.simplifyPaths) {
      const simplified = simplifyPaths(svgElement);
      if (simplified > 0) {
        optimizationsApplied.push(`Simplified ${simplified} complex paths`);
        console.log(`Simplified ${simplified} complex paths`);
      }
    }

    // 4. Aggressive node reduction for target
    if (options.enableNodeReduction && options.targetReduction > 0) {
      const reduced = aggressiveNodeReduction(svgElement, options.targetReduction);
      if (reduced > 0) {
        optimizationsApplied.push(`Removed ${reduced} nodes for ${options.targetReduction}% reduction target`);
        console.log(`Aggressive reduction: removed ${reduced} nodes`);
      }
    }

    optimizedSvg = dom.serialize();
    const afterAnalysis = analyzeComplexity(optimizedSvg);
    
    const reductionAchieved = Math.round(
      ((beforeAnalysis.totalNodes - afterAnalysis.totalNodes) / beforeAnalysis.totalNodes) * 100
    );

    console.log(`Optimization complete: ${reductionAchieved}% reduction achieved`);

    return {
      originalSVG: svgContent,
      optimizedSVG: optimizedSvg,
      beforeAnalysis,
      afterAnalysis,
      reductionAchieved,
      optimizationsApplied
    };
    
  } catch (error) {
    console.error('Error optimizing for animation:', error);
    const analysis = analyzeComplexity(svgContent);
    return {
      originalSVG: svgContent,
      optimizedSVG: svgContent,
      beforeAnalysis: analysis,
      afterAnalysis: analysis,
      reductionAchieved: 0,
      optimizationsApplied: []
    };
  }
}

/**
 * Calculate maximum nesting depth
 */
function calculateMaxNestingDepth(element: Element): number {
  let maxDepth = 0;
  
  function traverse(el: Element, depth: number) {
    maxDepth = Math.max(maxDepth, depth);
    Array.from(el.children).forEach(child => {
      traverse(child, depth + 1);
    });
  }
  
  traverse(element, 0);
  return maxDepth;
}

/**
 * Remove groups that only contain one child or have no meaningful attributes
 */
function removeRedundantGroups(svgElement: Element): number {
  let removedCount = 0;
  
  const groups = Array.from(svgElement.querySelectorAll('g'));
  
  groups.forEach(group => {
    const children = Array.from(group.children);
    const hasAttributes = group.getAttributeNames().some(name => 
      !['id', 'class'].includes(name) // Keep groups with meaningful attributes
    );
    
    // Remove groups with single child and no meaningful attributes
    if (children.length === 1 && !hasAttributes) {
      const child = children[0];
      const parent = group.parentElement;
      if (parent) {
        // Move child to parent and remove group
        parent.insertBefore(child, group);
        group.remove();
        removedCount++;
      }
    }
    
    // Remove empty groups
    else if (children.length === 0) {
      group.remove();
      removedCount++;
    }
  });
  
  return removedCount;
}

/**
 * Merge paths with similar attributes
 */
function mergeSimilarPaths(svgElement: Element): number {
  let mergedCount = 0;
  
  const paths = Array.from(svgElement.querySelectorAll('path'));
  const pathGroups = new Map<string, Element[]>();
  
  // Group paths by their styling attributes
  paths.forEach(path => {
    const key = [
      path.getAttribute('fill'),
      path.getAttribute('stroke'),
      path.getAttribute('stroke-width'),
      path.getAttribute('opacity')
    ].join('|');
    
    if (!pathGroups.has(key)) {
      pathGroups.set(key, []);
    }
    pathGroups.get(key)!.push(path);
  });
  
  // Merge paths in each group
  pathGroups.forEach(group => {
    if (group.length > 1) {
      const firstPath = group[0];
      const combinedPathData = group
        .map(path => path.getAttribute('d'))
        .filter(d => d)
        .join(' ');
      
      if (combinedPathData) {
        firstPath.setAttribute('d', combinedPathData);
        
        // Remove other paths
        for (let i = 1; i < group.length; i++) {
          group[i].remove();
          mergedCount++;
        }
      }
    }
  });
  
  return mergedCount;
}

/**
 * Simplify complex paths by reducing precision and removing small details
 */
function simplifyPaths(svgElement: Element): number {
  let simplifiedCount = 0;
  
  const paths = svgElement.querySelectorAll('path');
  
  paths.forEach(path => {
    const d = path.getAttribute('d');
    if (d && d.length > 200) { // Only simplify long paths
      // Round coordinates to 2 decimal places
      const simplified = d.replace(/(\d+\.\d{3,})/g, (match) => {
        return parseFloat(match).toFixed(2);
      });
      
      // Remove tiny movements (less than 0.5 units)
      const cleaned = simplified.replace(/[lL]\s*[+-]?0?\.?[0-4]\d*\s*[+-]?0?\.?[0-4]\d*/g, '');
      
      if (cleaned.length < d.length * 0.8) {
        path.setAttribute('d', cleaned);
        simplifiedCount++;
      }
    }
  });
  
  return simplifiedCount;
}

/**
 * Aggressive node reduction to meet target percentage
 */
function aggressiveNodeReduction(svgElement: Element, targetReduction: number): number {
  let removedCount = 0;
  const allElements = Array.from(svgElement.querySelectorAll('*'));
  const targetRemoval = Math.ceil((allElements.length * targetReduction) / 100);
  
  // Priority removal order (least important first)
  const removalCandidates: Element[] = [];
  
  // 1. Empty groups
  svgElement.querySelectorAll('g:empty').forEach(el => removalCandidates.push(el));
  
  // 2. Very small elements (likely noise)
  allElements.forEach(el => {
    if (el.tagName === 'circle' || el.tagName === 'rect') {
      const size = parseFloat(el.getAttribute('width') || el.getAttribute('r') || '0');
      if (size < 1) {
        removalCandidates.push(el);
      }
    }
  });
  
  // 3. Paths with very short data
  svgElement.querySelectorAll('path').forEach(path => {
    const d = path.getAttribute('d');
    if (d && d.length < 20) {
      removalCandidates.push(path);
    }
  });
  
  // 4. Duplicate elements (same tag + position)
  const positionMap = new Map<string, Element[]>();
  allElements.forEach(el => {
    const x = el.getAttribute('x') || el.getAttribute('cx') || '0';
    const y = el.getAttribute('y') || el.getAttribute('cy') || '0';
    const key = `${el.tagName}-${x}-${y}`;
    
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key)!.push(el);
  });
  
  positionMap.forEach(group => {
    if (group.length > 1) {
      // Keep first, remove duplicates
      for (let i = 1; i < group.length; i++) {
        removalCandidates.push(group[i]);
      }
    }
  });
  
  // Remove candidates up to target
  const toRemove = removalCandidates.slice(0, targetRemoval);
  toRemove.forEach(el => {
    el.remove();
    removedCount++;
  });
  
  return removedCount;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(
  beforeAnalysis: ComplexityAnalysis,
  afterAnalysis: ComplexityAnalysis,
  reductionAchieved: number
): string {
  return `
## SVG Animation Performance Report

### Before Optimization
- **Total Nodes:** ${beforeAnalysis.totalNodes}
- **Path Nodes:** ${beforeAnalysis.pathNodes}
- **Complexity:** ${beforeAnalysis.complexity} (${beforeAnalysis.complexityScore}/100)
- **Estimated FPS:** ${beforeAnalysis.estimatedFPS}fps

### After Optimization
- **Total Nodes:** ${afterAnalysis.totalNodes} (${reductionAchieved}% reduction)
- **Path Nodes:** ${afterAnalysis.pathNodes}
- **Complexity:** ${afterAnalysis.complexity} (${afterAnalysis.complexityScore}/100)
- **Estimated FPS:** ${afterAnalysis.estimatedFPS}fps

### Performance Gain
- **FPS Improvement:** +${afterAnalysis.estimatedFPS - beforeAnalysis.estimatedFPS}fps
- **Complexity Reduction:** -${beforeAnalysis.complexityScore - afterAnalysis.complexityScore} points
- **Node Reduction:** ${reductionAchieved}% fewer elements

### Recommendations
${afterAnalysis.recommendations.length > 0 ? 
  afterAnalysis.recommendations.map(r => `- ${r}`).join('\n') : 
  '✓ Optimization complete - SVG is animation-ready!'
}
`.trim();
}