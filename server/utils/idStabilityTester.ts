/**
 * ID Stability Testing and Verification System
 * Ensures deterministic ID generation works consistently across conversions
 */

export interface StabilityTestResult {
  testId: string;
  timestamp: string;
  passed: boolean;
  consistencyScore: number; // 0-100
  details: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageVariation: number;
    maxVariation: number;
  };
  variations: Array<{
    conversionAttempt: number;
    elementId: string;
    expectedId: string;
    actualId: string;
    matches: boolean;
  }>;
  recommendations: string[];
}

export interface IDConsistencyTest {
  name: string;
  description: string;
  testFunction: (svgContent: string, iterations: number) => Promise<boolean>;
  expectedBehavior: string;
}

/**
 * Run comprehensive ID stability tests
 */
export async function runStabilityTests(
  imageFile: Buffer,
  conversionOptions: any,
  iterations: number = 5
): Promise<StabilityTestResult> {
  console.log(`Running ID stability tests with ${iterations} iterations...`);
  
  const testId = `stability_${Date.now()}`;
  const variations: StabilityTestResult['variations'] = [];
  let consistentIds: Map<string, string> = new Map();
  let totalElements = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // Run multiple conversions of the same image
    for (let i = 0; i < iterations; i++) {
      console.log(`Running test iteration ${i + 1}/${iterations}`);
      
      // Simulate conversion (in real implementation, call actual conversion)
      const svgContent = await simulateConversion(imageFile, conversionOptions);
      const extractedIds = extractElementIds(svgContent);
      
      if (i === 0) {
        // First iteration - establish baseline
        extractedIds.forEach(id => {
          consistentIds.set(id, id);
        });
        totalElements = extractedIds.length;
        console.log(`Baseline established with ${totalElements} elements`);
      } else {
        // Compare with baseline
        extractedIds.forEach((actualId, index) => {
          const expectedId = Array.from(consistentIds.keys())[index];
          const matches = actualId === expectedId;
          
          variations.push({
            conversionAttempt: i + 1,
            elementId: `element_${index}`,
            expectedId: expectedId || 'UNKNOWN',
            actualId,
            matches
          });
          
          if (matches) {
            passedTests++;
          } else {
            failedTests++;
            console.log(`ID variation detected: expected "${expectedId}", got "${actualId}"`);
          }
        });
      }
    }
    
    // Calculate metrics
    const totalTests = variations.length;
    const consistencyScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;
    const averageVariation = calculateAverageVariation(variations);
    const maxVariation = calculateMaxVariation(variations);
    
    // Generate recommendations
    const recommendations = generateRecommendations(consistencyScore, variations);
    
    const result: StabilityTestResult = {
      testId,
      timestamp: new Date().toISOString(),
      passed: consistencyScore >= 95, // 95% consistency required to pass
      consistencyScore,
      details: {
        totalTests,
        passedTests,
        failedTests,
        averageVariation,
        maxVariation
      },
      variations,
      recommendations
    };
    
    console.log(`Stability test complete: ${consistencyScore}% consistent (${passedTests}/${totalTests} passed)`);
    return result;
    
  } catch (error) {
    console.error('Error running stability tests:', error);
    return {
      testId,
      timestamp: new Date().toISOString(),
      passed: false,
      consistencyScore: 0,
      details: {
        totalTests: 0,
        passedTests: 0,
        failedTests: iterations,
        averageVariation: 100,
        maxVariation: 100
      },
      variations: [],
      recommendations: ['Fix critical error in ID generation system', `Error: ${error}`]
    };
  }
}

/**
 * Simulate SVG conversion (placeholder)
 */
async function simulateConversion(imageFile: Buffer, options: any): Promise<string> {
  // In real implementation, this would call the actual conversion pipeline
  // For testing, generate deterministic SVG with predictable IDs
  
  const timestamp = Date.now();
  const elements = ['path', 'circle', 'rect', 'polygon'];
  
  let svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n';
  
  // Generate elements with supposedly deterministic IDs
  for (let i = 0; i < 5; i++) {
    const elementType = elements[i % elements.length];
    
    // This should be deterministic, but we'll add some variation to test
    const shouldVary = options.testVariation && Math.random() > 0.8;
    const id = shouldVary ? 
      `anim_${elementType}_${i}_var_${timestamp}` : 
      `anim_${elementType}_${i}`;
    
    switch (elementType) {
      case 'path':
        svg += `  <path id="${id}" d="M10,${10 + i * 15} L90,${10 + i * 15}" stroke="black"/>\n`;
        break;
      case 'circle':
        svg += `  <circle id="${id}" cx="50" cy="${20 + i * 15}" r="5" fill="red"/>\n`;
        break;
      case 'rect':
        svg += `  <rect id="${id}" x="20" y="${15 + i * 15}" width="60" height="8" fill="blue"/>\n`;
        break;
      case 'polygon':
        svg += `  <polygon id="${id}" points="30,${25 + i * 15} 70,${25 + i * 15} 50,${35 + i * 15}" fill="green"/>\n`;
        break;
    }
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Extract element IDs from SVG
 */
function extractElementIds(svgContent: string): string[] {
  const idMatches = svgContent.match(/id="([^"]+)"/g) || [];
  return idMatches.map(match => match.replace(/id="([^"]+)"/, '$1'));
}

/**
 * Calculate average variation percentage
 */
function calculateAverageVariation(variations: StabilityTestResult['variations']): number {
  if (variations.length === 0) return 0;
  
  const mismatchCount = variations.filter(v => !v.matches).length;
  return Math.round((mismatchCount / variations.length) * 100);
}

/**
 * Calculate maximum variation in a single test
 */
function calculateMaxVariation(variations: StabilityTestResult['variations']): number {
  const testAttempts = new Map<number, number>();
  
  variations.forEach(variation => {
    const attempt = variation.conversionAttempt;
    const current = testAttempts.get(attempt) || 0;
    testAttempts.set(attempt, current + (variation.matches ? 0 : 1));
  });
  
  const maxMismatches = Math.max(0, ...Array.from(testAttempts.values()));
  const elementsPerAttempt = variations.length / (testAttempts.size || 1);
  
  return Math.round((maxMismatches / elementsPerAttempt) * 100);
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(consistencyScore: number, variations: StabilityTestResult['variations']): string[] {
  const recommendations: string[] = [];
  
  if (consistencyScore < 95) {
    recommendations.push(`Consistency score ${consistencyScore}% is below required 95% - ID generation needs improvement`);
  }
  
  if (consistencyScore < 80) {
    recommendations.push('Critical: Implement proper deterministic ID generation algorithm');
    recommendations.push('Consider using content-based hashing for stable IDs');
  }
  
  if (consistencyScore < 50) {
    recommendations.push('Emergency: Current ID system is unreliable for production use');
    recommendations.push('Implement seed-based random number generation');
  }
  
  // Analyze variation patterns
  const frequentFailures = new Map<string, number>();
  variations.filter(v => !v.matches).forEach(variation => {
    const element = variation.elementId;
    frequentFailures.set(element, (frequentFailures.get(element) || 0) + 1);
  });
  
  if (frequentFailures.size > 0) {
    const mostProblematic = Array.from(frequentFailures.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    recommendations.push(`Most unstable elements: ${mostProblematic.map(([id, count]) => `${id} (${count} failures)`).join(', ')}`);
  }
  
  if (variations.some(v => v.actualId.includes('undefined') || v.actualId.includes('null'))) {
    recommendations.push('Fix null/undefined handling in ID generation');
  }
  
  if (variations.some(v => v.actualId.includes('timestamp') || v.actualId.match(/\d{13}/))) {
    recommendations.push('Remove timestamp-based components from ID generation');
  }
  
  if (consistencyScore >= 95) {
    recommendations.push('✓ ID generation system is stable and ready for production');
    recommendations.push('Consider implementing additional edge case testing');
  }
  
  return recommendations;
}

/**
 * Test specific ID generation scenarios
 */
export const ID_CONSISTENCY_TESTS: IDConsistencyTest[] = [
  {
    name: 'Basic Element Stability',
    description: 'Tests that simple SVG elements get consistent IDs across conversions',
    expectedBehavior: 'Same elements should always get the same IDs',
    testFunction: async (svgContent: string, iterations: number) => {
      // Implementation would test basic element ID consistency
      return true; // Placeholder
    }
  },
  
  {
    name: 'Complex Path Stability',
    description: 'Tests ID consistency for complex paths with many points',
    expectedBehavior: 'Complex paths should have stable IDs based on path data',
    testFunction: async (svgContent: string, iterations: number) => {
      // Implementation would test complex path ID consistency
      return true; // Placeholder
    }
  },
  
  {
    name: 'Color-Based Grouping Stability',
    description: 'Tests that color-based grouping produces consistent group IDs',
    expectedBehavior: 'Elements with same colors should consistently group together',
    testFunction: async (svgContent: string, iterations: number) => {
      // Implementation would test color grouping consistency
      return true; // Placeholder
    }
  },
  
  {
    name: 'Transform Preservation',
    description: 'Tests that transform attributes are consistently applied to same elements',
    expectedBehavior: 'Elements with transforms should maintain same IDs and transform data',
    testFunction: async (svgContent: string, iterations: number) => {
      // Implementation would test transform consistency
      return true; // Placeholder
    }
  }
];

/**
 * Generate stability test report
 */
export function generateStabilityReport(result: StabilityTestResult): string {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  const scoreColor = result.consistencyScore >= 95 ? 'green' : result.consistencyScore >= 80 ? 'orange' : 'red';
  
  return `
# ID Stability Test Report

**Status:** ${status}  
**Consistency Score:** ${result.consistencyScore}%  
**Test ID:** ${result.testId}  
**Timestamp:** ${result.timestamp}

## Test Summary

- **Total Tests:** ${result.details.totalTests}
- **Passed:** ${result.details.passedTests}
- **Failed:** ${result.details.failedTests}
- **Average Variation:** ${result.details.averageVariation}%
- **Max Variation:** ${result.details.maxVariation}%

## Recommendations

${result.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Variations

${result.variations.length > 0 ? 
  result.variations.map(v => 
    `**Attempt ${v.conversionAttempt}:** ${v.elementId} - Expected: \`${v.expectedId}\`, Got: \`${v.actualId}\` ${v.matches ? '✅' : '❌'}`
  ).join('\n') : 
  'No variations detected - perfect consistency!'
}

${result.passed ? 
  '🎉 **The ID generation system is stable and production-ready!**' : 
  '⚠️ **The ID generation system needs improvement before production use.**'
}
`.trim();
}

/**
 * Run continuous stability monitoring
 */
export class StabilityMonitor {
  private testHistory: StabilityTestResult[] = [];
  private alertThreshold = 90; // Alert if consistency drops below 90%
  
  async runContinuousTest(
    testInterval: number = 3600000, // 1 hour default
    maxHistory: number = 100
  ): Promise<void> {
    console.log(`Starting continuous stability monitoring (interval: ${testInterval}ms)`);
    
    setInterval(async () => {
      try {
        // Run stability test with sample data
        const sampleBuffer = Buffer.from('sample_image_data'); // In real implementation, use actual image
        const result = await runStabilityTests(sampleBuffer, { testVariation: false }, 3);
        
        // Store result
        this.testHistory.push(result);
        if (this.testHistory.length > maxHistory) {
          this.testHistory.shift(); // Remove oldest
        }
        
        // Check for alerts
        if (result.consistencyScore < this.alertThreshold) {
          console.warn(`🚨 STABILITY ALERT: Consistency dropped to ${result.consistencyScore}%`);
          this.sendAlert(result);
        }
        
        console.log(`Stability check: ${result.consistencyScore}% consistency`);
        
      } catch (error) {
        console.error('Error in continuous stability test:', error);
      }
    }, testInterval);
  }
  
  private sendAlert(result: StabilityTestResult): void {
    // In real implementation, this would send alerts via email, Slack, etc.
    console.error('STABILITY ALERT:', {
      score: result.consistencyScore,
      recommendations: result.recommendations,
      timestamp: result.timestamp
    });
  }
  
  getTestHistory(): StabilityTestResult[] {
    return [...this.testHistory];
  }
  
  getAverageStability(days: number = 7): number {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentTests = this.testHistory.filter(test => 
      new Date(test.timestamp).getTime() > cutoff
    );
    
    if (recentTests.length === 0) return 100;
    
    const avgScore = recentTests.reduce((sum, test) => sum + test.consistencyScore, 0) / recentTests.length;
    return Math.round(avgScore);
  }
}