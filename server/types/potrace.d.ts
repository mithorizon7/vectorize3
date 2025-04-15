declare module 'potrace' {
  export class Potrace {
    constructor();
    
    setParameters(params: {
      threshold?: number;
      blackOnWhite?: boolean;
      optCurve?: boolean;
      turdSize?: number;
      alphaMax?: number;
      optTolerance?: number;
      [key: string]: any;
    }): void;
    
    loadImage(path: string, callback: (err: Error | null) => void): void;
    
    getSVG(scale?: number): string;
    
    getPathTag(fillColor?: string, scale?: number): string;
  }
  
  export function trace(
    file: string, 
    options: any, 
    callback: (err: Error | null, svg: string) => void
  ): void;
}