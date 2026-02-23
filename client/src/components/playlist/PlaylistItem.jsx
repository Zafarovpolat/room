// client/src/components/playlist/PlaylistItem.jsx

import { X, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { SOURCE_COLORS } from '../../utils/constants';

export function PlaylistItem({ 
  item, 
  index, 
  total, 
  isPlaying, 
  onSelect, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors group ${
        isPlaying 
          ? 'bg-violet-600/20 border border-violet-600/30' 
          : 'hover:bg-zinc-800 border border-transparent'
      }`}
    >
      {/* Кнопки перемещения */}
      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={index === 0}
          className="text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700 disabled:cursor-not-allowed"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={index === total - 1}
          className="text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700 disabled:cursor-not-allowed"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Номер / Playing */}
      <span className="w-5 text-center shrink-0">
        {isPlaying ? (
          <Play size={12} className="text-violet-400 mx-auto" />
        ) : (
          <span className="text-xs text-zinc-600">{index + 1}</span>
        )}
      </span>

      {/* Title — кликабельный */}
      <button
        onClick={onSelect}
        className="flex-1 truncate text-zinc-300 text-left hover:text-white transition-colors"
      >
        {item.title || item.url}
      </button>

      {/* Source dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: SOURCE_COLORS[item.source] }}
      />

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
}