// client/src/components/history/HistoryPanel.jsx

import { useState, useEffect } from 'react';
import { loadHistory } from '../../api';
import { HistoryItem } from './HistoryItem';
import { X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { formatDateGroup } from '../../utils/formatTime';

export function HistoryPanel({ roomId, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (cursorId) => {
    setLoading(true);
    try {
      const data = await loadHistory(roomId, cursorId);
      if (cursorId) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setHasMore(data.hasMore);
      if (data.items.length > 0) {
        setCursor(data.items[data.items.length - 1].id);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Группировать по дате
  const grouped = {};
  items.forEach(item => {
    const dateKey = formatDateGroup(item.watchedAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(item);
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold">📜 История просмотров</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="text-zinc-500 text-center py-10">Пока ничего не смотрели</p>
          ) : (
            Object.entries(grouped).map(([date, dateItems]) => (
              <div key={date} className="mb-4">
                <p className="text-xs text-zinc-500 mb-2 uppercase font-medium">{date}</p>
                <div className="space-y-2">
                  {dateItems.map(item => (
                    <HistoryItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}

          {hasMore && (
            <button
              onClick={() => fetchHistory(cursor)}
              className="w-full py-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Загрузить ещё
            </button>
          )}
        </div>
      </div>
    </div>
  );
}