// Helper functions for API requests

/**
 * Upload and convert an image to SVG
 */
export async function convertImageToSVG(
  file: File,
  options: Record<string, any>
): Promise<{ svg: string }> {
  const formData = new FormData();
  formData.append('image', file);

  // Add options to form data
  Object.entries(options).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value.toString());
    } else if (Array.isArray(value)) {
      formData.append(key, value.join(','));
    } else {
      formData.append(key, value.toString());
    }
  });

  const response = await fetch('/api/convert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Apply color to SVG content
 */
export async function applySvgColor(
  svgContent: string,
  color: string
): Promise<{ svg: string }> {
  const response = await fetch('/api/color', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ svg: svgContent, color }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Set SVG background transparency
 */
export async function setSvgBackground(
  svgContent: string,
  isTransparent: boolean
): Promise<{ svg: string }> {
  const response = await fetch('/api/background', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ svg: svgContent, transparent: isTransparent }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
