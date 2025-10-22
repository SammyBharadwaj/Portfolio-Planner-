import { useEffect, useState, useRef } from "react";
import { Edit2, Check } from "lucide-react";
import { PortfolioData, Highlight } from "../App";

interface PortfolioEditorProps {
  onTextSelect: (text: string) => void;
  portfolioData: PortfolioData;
  onUpdatePortfolio: (data: PortfolioData) => void;
  highlights: Highlight[];
  hoveredSuggestionId: number | null;
  isDrawerOpen: boolean;
}

export function PortfolioEditor({ 
  onTextSelect, 
  portfolioData, 
  onUpdatePortfolio, 
  highlights,
  hoveredSuggestionId,
  isDrawerOpen
}: PortfolioEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const markerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [lineCoordinates, setLineCoordinates] = useState<{ [key: number]: { x1: number; y1: number; x2: number; y2: number } }>({});

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        onTextSelect(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect]);

  // Calculate line positions when hovering
  useEffect(() => {
    if (hoveredSuggestionId !== null) {
      const updateLinePositions = () => {
        const markerElement = markerRefs.current[hoveredSuggestionId];
        const suggestionElement = document.querySelector(`[data-suggestion-id="${hoveredSuggestionId}"]`);
        
        if (markerElement && suggestionElement) {
          const markerRect = markerElement.getBoundingClientRect();
          const suggestionRect = suggestionElement.getBoundingClientRect();
          
          // Calculate center points
          const x1 = markerRect.right + 5;
          const y1 = markerRect.top + markerRect.height / 2;
          const x2 = suggestionRect.left - 5;
          const y2 = suggestionRect.top + suggestionRect.height / 2;
          
          setLineCoordinates(prev => ({
            ...prev,
            [hoveredSuggestionId]: { x1, y1, x2, y2 }
          }));
        }
      };
      
      updateLinePositions();
      // Update on scroll or resize
      window.addEventListener('scroll', updateLinePositions, true);
      window.addEventListener('resize', updateLinePositions);
      
      return () => {
        window.removeEventListener('scroll', updateLinePositions, true);
        window.removeEventListener('resize', updateLinePositions);
      };
    }
  }, [hoveredSuggestionId]);

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingField) return;

    const updatedData = { ...portfolioData };
    
    if (editingField === 'name') {
      updatedData.name = tempValue;
    } else if (editingField === 'role') {
      updatedData.role = tempValue;
    } else if (editingField === 'bio') {
      updatedData.bio = tempValue;
    } else if (editingField.startsWith('project-')) {
      const [, projectId, field] = editingField.split('-');
      const projectIndex = updatedData.projects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        if (field === 'title') {
          updatedData.projects[projectIndex].title = tempValue;
        } else if (field === 'description') {
          updatedData.projects[projectIndex].description = tempValue;
        }
      }
    } else if (editingField.startsWith('experience-')) {
      const field = editingField.replace('experience-', '');
      if (field === 'title') updatedData.experience.title = tempValue;
      else if (field === 'company') updatedData.experience.company = tempValue;
      else if (field === 'description') updatedData.experience.description = tempValue;
    }

    onUpdatePortfolio(updatedData);
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const highlightText = (text: string, field: string) => {
    // Don't apply highlights if drawer is closed
    if (!isDrawerOpen) {
      return text;
    }
    
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Sort highlights by position in text
    const fieldHighlights = highlights.filter(h => h.field === field);
    
    fieldHighlights.forEach(highlight => {
      const index = text.indexOf(highlight.text, lastIndex);
      if (index !== -1) {
        // Add text before highlight
        if (index > lastIndex) {
          result.push(text.substring(lastIndex, index));
        }
        
        // Add highlighted text
        const highlightClass = highlight.type === 'weak' 
          ? 'bg-red-50 border-b-2 border-red-300 border-dotted text-red-900 relative'
          : 'bg-emerald-50/60 text-emerald-900/80';
        
        result.push(
          <span 
            key={highlight.id} 
            className={highlightClass}
            data-highlight-id={highlight.id}
          >
            {highlight.text}
          </span>
        );
        
        lastIndex = index + highlight.text.length;
      }
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    return result.length > 0 ? result : text;
  };

  const getWeakHighlightsForField = (field: string) => {
    return highlights.filter(h => h.field === field && h.type === 'weak');
  };

  const EditableField = ({ 
    field, 
    value, 
    className, 
    multiline = false 
  }: { 
    field: string; 
    value: string; 
    className: string; 
    multiline?: boolean;
  }) => {
    const isEditing = editingField === field;
    const weakHighlights = getWeakHighlightsForField(field);

    return (
      <div className="group relative">
        {isEditing ? (
          <div className="flex items-start gap-2">
            {multiline ? (
              <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className={`${className} w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none resize-none`}
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className={`${className} w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none`}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
              />
            )}
            <button
              onClick={saveEdit}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-1"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative flex items-start">
            {/* Numbered circles for weak highlights - only show when drawer is open */}
            {isDrawerOpen && weakHighlights.length > 0 && (
              <div className="absolute -left-10 top-0 flex flex-col gap-1">
                {weakHighlights.map(h => (
                  <div 
                    key={h.id}
                    ref={(el) => markerRefs.current[h.id] = el}
                    className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-lg"
                    data-marker-id={h.id}
                  >
                    {h.id}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex-1">
              <div className={className}>
                {highlightText(value, field)}
              </div>
            </div>
            
            <button
              onClick={() => startEditing(field, value)}
              className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white p-8 pl-16 overflow-auto relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <EditableField
            field="role"
            value={portfolioData.role}
            className="text-[#888] text-sm mb-2"
          />
          <EditableField
            field="name"
            value={portfolioData.name}
            className="text-black text-4xl mb-4"
          />
          <EditableField
            field="bio"
            value={portfolioData.bio}
            className="text-[#555] text-lg"
          />
        </div>

        {/* Projects Section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-black text-2xl mb-4">Featured Projects</h2>
            
            {portfolioData.projects.map((project) => (
              <div 
                key={project.id}
                className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm"
              >
                <EditableField
                  field={`project-${project.id}-title`}
                  value={project.title}
                  className="text-black text-xl mb-2"
                />
                <EditableField
                  field={`project-${project.id}-description`}
                  value={project.description}
                  className="text-[#555] mb-4"
                  multiline
                />
                <div className="flex gap-2 flex-wrap">
                  {project.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-white text-[#666] rounded-full text-sm border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Experience Section */}
          <div>
            <h2 className="text-black text-2xl mb-4">Experience</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <EditableField
                  field="experience-title"
                  value={portfolioData.experience.title}
                  className="text-black text-xl"
                />
                <span className="text-[#888] text-sm">{portfolioData.experience.period}</span>
              </div>
              <EditableField
                field="experience-company"
                value={portfolioData.experience.company}
                className="text-[#555] mb-2"
              />
              <EditableField
                field="experience-description"
                value={portfolioData.experience.description}
                className="text-[#555]"
                multiline
              />
            </div>
          </div>
        </div>
      </div>

      {/* SVG overlay for connecting lines - only show when hovering */}
      {hoveredSuggestionId !== null && lineCoordinates[hoveredSuggestionId] && (
        <svg 
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>
          
          {(() => {
            const coords = lineCoordinates[hoveredSuggestionId];
            const controlX1 = coords.x1 + (coords.x2 - coords.x1) * 0.5;
            const controlX2 = coords.x1 + (coords.x2 - coords.x1) * 0.5;
            
            return (
              <path
                d={`M ${coords.x1} ${coords.y1} C ${controlX1} ${coords.y1}, ${controlX2} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="6,6"
                fill="none"
                opacity="0.6"
                markerEnd="url(#arrowhead)"
                className="animate-[dash_20s_linear_infinite]"
              />
            );
          })()}
        </svg>
      )}
    </div>
  );
}
