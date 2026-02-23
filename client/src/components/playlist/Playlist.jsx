// client/src/components/playlist/Playlist.jsx

import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { PlaylistItem } from './PlaylistItem';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export function Playlist({ emit }) {
  const { items, isOpen, toggleOpen } = usePlaylistStore();
  const currentUrl = useVideoStore(s => s.url);

  const handleSelect = (itemId) => {
    emit('playlist:select', { itemId });
  };

  const handleRemove = (itemId) => {
    emit('playlist:remove', { itemId });
  };

  const handleClear = () => {
    emit('playlist:clear');
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...items];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    emit('playlist:reorder', { orderedIds: newOrder.map(i => i.id) });
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const newOrder = [...items];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    emit('playlist:reorder', { orderedIds: newOrder.map(i => i.id) });
  };

  return (
    <div className="bg-zinc-900 border-t border-zinc-800">
      <button
        onClick={toggleOpen}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span>📋 Плейлист ({items.length})</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-1 max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">Плейлист пуст</p>
          ) : (
            <>
              {items.map((item, index) => (
                <PlaylistItem
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  isPlaying={item.url === currentUrl}
                  onSelect={() => handleSelect(item.id)}
                  onRemove={() => handleRemove(item.id)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              ))}

              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors mt-2"
              >
                <Trash2 size={12} />
                Очистить
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}