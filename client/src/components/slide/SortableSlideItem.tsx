import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { CaseSlide } from '../../types';

interface Props {
  slide: CaseSlide;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

export const SortableSlideItem: React.FC<Props> = ({ 
  slide, 
  index, 
  isActive, 
  onSelect, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (isActive ? 10 : 0),
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(index)}
      className={`group p-4 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-3 ${
        isActive 
          ? 'border-blue-500 bg-gray-700 shadow-lg scale-[1.02] active-slide-card' 
          : 'border-gray-700 bg-gray-800 hover:bg-gray-700/80 hover:border-gray-500'
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : ''}`}
    >
      {/* DRAG HANDLE */}
      <div 
        {...attributes} 
        {...listeners}
        className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing p-1 -ml-2 rounded hover:bg-gray-600 transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex justify-between items-center mb-1">
          <span className={isActive ? 'text-blue-300' : ''}>{slide.type.replace('_', ' ')}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Haluatko varmasti poistaa dian?')) {
                onDelete(index);
              }
            }}
            className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition-colors"
            title="Poista dia"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="truncate font-bold text-gray-100 text-lg leading-tight">
          {slide.title || '(Nimetön dia)'}
        </div>
      </div>
    </div>
  );
};
