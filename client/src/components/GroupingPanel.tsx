import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Edit3, 
  ChevronRight, 
  ChevronDown,
  Palette,
  Group,
  Move,
  Trash2,
  Plus
} from 'lucide-react';

export interface SVGGroup {
  id: string;
  name: string;
  type: 'group' | 'element';
  visible: boolean;
  locked: boolean;
  children?: SVGGroup[];
  element?: Element;
  color?: string;
  parentId?: string;
}

interface GroupingPanelProps {
  svgContent: string;
  onStructureChange: (groups: SVGGroup[]) => void;
  className?: string;
}

export function GroupingPanel({ 
  svgContent, 
  onStructureChange, 
  className = "" 
}: GroupingPanelProps) {
  const [groups, setGroups] = useState<SVGGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<SVGGroup | null>(null);

  // Parse SVG and build group structure
  const parseStructure = useCallback(() => {
    if (!svgContent) return;

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'text/xml');
      const svgElement = svgDoc.documentElement;

      if (svgElement.tagName !== 'svg') {
        console.error('Invalid SVG content');
        return;
      }

      const buildGroupTree = (element: Element, parentId?: string): SVGGroup[] => {
        const children = Array.from(element.children);
        const result: SVGGroup[] = [];

        children.forEach(child => {
          const id = child.getAttribute('id') || `${child.tagName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const tagName = child.tagName.toLowerCase();
          
          // Set ID if it doesn't exist
          if (!child.getAttribute('id')) {
            child.setAttribute('id', id);
          }

          // Extract color information
          const fill = child.getAttribute('fill');
          const stroke = child.getAttribute('stroke');
          const color = fill && fill !== 'none' ? fill : stroke && stroke !== 'none' ? stroke : undefined;

          const group: SVGGroup = {
            id,
            name: generateSemanticName(child, id),
            type: tagName === 'g' ? 'group' : 'element',
            visible: true,
            locked: false,
            element: child,
            color,
            parentId
          };

          // Recursively process children for groups
          if (tagName === 'g' && child.children.length > 0) {
            group.children = buildGroupTree(child, id);
          }

          result.push(group);
        });

        return result;
      };

      const structure = buildGroupTree(svgElement);
      setGroups(structure);
      onStructureChange(structure);
      console.log('Parsed SVG structure:', structure);

    } catch (error) {
      console.error('Error parsing SVG structure:', error);
    }
  }, [svgContent, onStructureChange]);

  // Auto-parse structure when SVG content changes
  React.useEffect(() => {
    parseStructure();
  }, [parseStructure]);

  // Generate semantic names for elements
  const generateSemanticName = (element: Element, fallbackId: string): string => {
    const tagName = element.tagName.toLowerCase();
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');
    const className = element.getAttribute('class');

    // Try to extract meaning from existing attributes
    if (className && className.includes('wheel')) return 'Wheel';
    if (className && className.includes('eye')) return 'Eye';
    if (className && className.includes('body')) return 'Body';

    // Generate based on element type and color
    const colorName = getColorName(fill || stroke);
    const typeName = getTypeName(tagName);
    
    if (colorName && typeName !== 'Shape') {
      return `${colorName} ${typeName}`;
    } else if (colorName) {
      return `${colorName} Shape`;
    } else if (typeName !== 'Shape') {
      return typeName;
    }

    // Fallback to cleaned ID
    return cleanId(fallbackId);
  };

  // Get human-readable color names
  const getColorName = (color?: string | null): string => {
    if (!color || color === 'none') return '';
    
    const colorMap: Record<string, string> = {
      '#ff0000': 'Red', '#f00': 'Red',
      '#00ff00': 'Green', '#0f0': 'Green', '#008000': 'Green',
      '#0000ff': 'Blue', '#00f': 'Blue',
      '#ffff00': 'Yellow', '#ff0': 'Yellow',
      '#ff00ff': 'Purple', '#f0f': 'Purple', '#800080': 'Purple',
      '#00ffff': 'Cyan', '#0ff': 'Cyan',
      '#ffa500': 'Orange',
      '#000000': 'Black', '#000': 'Black',
      '#ffffff': 'White', '#fff': 'White',
      '#808080': 'Gray', '#888': 'Gray'
    };

    const lowerColor = color.toLowerCase();
    return colorMap[lowerColor] || '';
  };

  // Get human-readable type names
  const getTypeName = (tagName: string): string => {
    const typeMap: Record<string, string> = {
      'circle': 'Circle',
      'rect': 'Rectangle',
      'path': 'Path',
      'line': 'Line',
      'polygon': 'Polygon',
      'ellipse': 'Ellipse',
      'g': 'Group'
    };
    
    return typeMap[tagName] || 'Shape';
  };

  // Clean up ID for display
  const cleanId = (id: string): string => {
    return id.replace(/^(anim_|path_|rect_|circle_)/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Auto-group suggestions
  const autoGroupByColor = useCallback(() => {
    const colorGroups = new Map<string, SVGGroup[]>();
    
    // Collect elements by color
    const collectElements = (items: SVGGroup[]) => {
      items.forEach(item => {
        if (item.type === 'element' && item.color) {
          const colorKey = item.color.toLowerCase();
          if (!colorGroups.has(colorKey)) {
            colorGroups.set(colorKey, []);
          }
          colorGroups.get(colorKey)!.push(item);
        }
        if (item.children) {
          collectElements(item.children);
        }
      });
    };

    collectElements(groups);

    // Create groups for colors with multiple elements
    const newGroups: SVGGroup[] = [];
    colorGroups.forEach((elements, color) => {
      if (elements.length > 1) {
        const colorName = getColorName(color) || 'Color';
        const groupId = `group_${colorName.toLowerCase()}_${Date.now()}`;
        
        newGroups.push({
          id: groupId,
          name: `${colorName} Elements`,
          type: 'group',
          visible: true,
          locked: false,
          children: elements.map(el => ({ ...el, parentId: groupId })),
          color
        });
      } else {
        newGroups.push(elements[0]);
      }
    });

    setGroups(newGroups);
    onStructureChange(newGroups);
  }, [groups, onStructureChange]);

  // Toggle visibility
  const toggleVisibility = useCallback((id: string) => {
    const updateVisibility = (items: SVGGroup[]): SVGGroup[] => {
      return items.map(item => {
        if (item.id === id) {
          const newVisibility = !item.visible;
          // Update actual SVG element
          if (item.element && 'style' in item.element) {
            (item.element as HTMLElement).style.display = newVisibility ? '' : 'none';
          }
          return { ...item, visible: newVisibility };
        }
        if (item.children) {
          return { ...item, children: updateVisibility(item.children) };
        }
        return item;
      });
    };

    const updatedGroups = updateVisibility(groups);
    setGroups(updatedGroups);
    onStructureChange(updatedGroups);
  }, [groups, onStructureChange]);

  // Toggle lock
  const toggleLock = useCallback((id: string) => {
    const updateLock = (items: SVGGroup[]): SVGGroup[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, locked: !item.locked };
        }
        if (item.children) {
          return { ...item, children: updateLock(item.children) };
        }
        return item;
      });
    };

    const updatedGroups = updateLock(groups);
    setGroups(updatedGroups);
    onStructureChange(updatedGroups);
  }, [groups, onStructureChange]);

  // Rename item
  const renameItem = useCallback((id: string, newName: string) => {
    const updateName = (items: SVGGroup[]): SVGGroup[] => {
      return items.map(item => {
        if (item.id === id) {
          // Update actual SVG element ID and name
          if (item.element) {
            // Create a semantic ID from the name
            const semanticId = newName.toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            const newId = `anim_${semanticId}`;
            item.element.setAttribute('id', newId);
            return { ...item, id: newId, name: newName };
          }
          return { ...item, name: newName };
        }
        if (item.children) {
          return { ...item, children: updateName(item.children) };
        }
        return item;
      });
    };

    const updatedGroups = updateName(groups);
    setGroups(updatedGroups);
    onStructureChange(updatedGroups);
    setEditingId(null);
  }, [groups, onStructureChange]);

  // Toggle expand/collapse
  const toggleExpanded = useCallback((id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }, [expandedIds]);

  // Render group item
  const renderGroupItem = (group: SVGGroup, depth = 0) => {
    const hasChildren = group.children && group.children.length > 0;
    const isExpanded = expandedIds.has(group.id);
    const isEditing = editingId === group.id;

    return (
      <div key={group.id} className="select-none">
        <div 
          className={`flex items-center px-2 py-1 hover:bg-gray-100 ${group.locked ? 'opacity-60' : ''}`}
          style={{ paddingLeft: `${(depth * 16) + 8}px` }}
          data-testid={`group-item-${group.id}`}
        >
          {/* Expand/collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1"
              onClick={() => toggleExpanded(group.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Color indicator */}
          {group.color && (
            <div 
              className="w-3 h-3 rounded-full border mr-2 flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                defaultValue={group.name}
                className="h-6 text-xs"
                onBlur={(e) => renameItem(group.id, e.target.value || group.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameItem(group.id, e.currentTarget.value || group.name);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
              />
            ) : (
              <span 
                className="text-xs truncate block cursor-pointer"
                onClick={() => setEditingId(group.id)}
                title={group.name}
              >
                {group.name}
              </span>
            )}
          </div>

          {/* Type badge */}
          <Badge variant="outline" className="text-xs h-4 px-1 mr-1">
            {group.type === 'group' ? 'G' : group.element?.tagName.toUpperCase()}
          </Badge>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => setEditingId(group.id)}
              title="Rename"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleVisibility(group.id)}
              title={group.visible ? "Hide" : "Show"}
            >
              {group.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 opacity-50" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleLock(group.id)}
              title={group.locked ? "Unlock" : "Lock"}
            >
              {group.locked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {group.children!.map(child => renderGroupItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Layers & Groups
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {groups.length} item{groups.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Auto-group tools */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Auto-Group</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={autoGroupByColor}
              className="flex-1 text-xs"
              disabled={groups.length === 0}
              data-testid="auto-group-by-color"
            >
              <Palette className="h-3 w-3 mr-1" />
              By Color
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={groups.length === 0}
            >
              <Group className="h-3 w-3 mr-1" />
              By Type
            </Button>
          </div>
        </div>

        {/* Layer tree */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">Structure</div>
          <div className="border rounded max-h-64 overflow-y-auto bg-gray-50">
            {groups.length > 0 ? (
              <div className="p-1">
                {groups.map(group => renderGroupItem(group))}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No layers found</p>
                <p className="text-xs mt-1">Upload and convert an image first</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {groups.length > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <div>{groups.filter(g => g.visible).length} visible</div>
            <div>{groups.filter(g => g.locked).length} locked</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}