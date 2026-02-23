// client/src/components/history/HistoryItem.jsx

import { SOURCE_COLORS, SOURCE_LABELS } from '../../utils/constants';

export function HistoryItem({ item }) {
  const users = (() => {
    try { return JSON.parse(item.watchedBy); }
    catch { return []; }
  })();

  const time = new Date(item.watchedAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 hover:bg-zinc-800 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title || 'Без названия'}</p>
          <p className="text-xs text-zinc-500 mt-1">
            Смотрели: {users.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: SOURCE_COLORS[item.source] }}
          />
          <span className="text-xs text-zinc-500">{time}</span>
        </div>
      </div>
    </div>
  );
}