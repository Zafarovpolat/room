import { useState } from 'react';
import { parseVideoUrl } from '../../utils/parseVideoUrl';
import { SOURCE_COLORS } from '../../utils/constants';
import { Play, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export function VideoUrlInput({ emit }) {
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    if (value.trim()) {
      setParsed(parseVideoUrl(value));
    } else {
      setParsed(null);
    }
  };

  const handlePlay = () => {
    if (!parsed?.valid) {
      toast.error('Невалидная ссылка');
      return;
    }
    emit('video:change', { url: url.trim(), source: parsed.type });
    setUrl('');
    setParsed(null);
  };

  const handleAddToPlaylist = () => {
    if (!parsed?.valid) {
      toast.error('Невалидная ссылка');
      return;
    }
    emit('playlist:add', { url: url.trim(), source: parsed.type });
    setUrl('');
    setParsed(null);
    toast.success('Добавлено в плейлист');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handlePlay();
  };

  const borderColor = parsed
    ? parsed.valid
      ? SOURCE_COLORS[parsed.type]
      : '#ef4444'
    : undefined;

  return (
    <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2">
      {parsed?.valid && (
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: SOURCE_COLORS[parsed.type] }}
        />
      )}

      <input
        value={url}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Вставьте ссылку YouTube, VK или Rutube"
        className="flex-1 bg-zinc-800 border rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none transition-colors"
        style={{ borderColor: borderColor || '#3f3f46' }}
      />

      <Button variant="primary" size="sm" onClick={handlePlay} disabled={!parsed?.valid}>
        <Play size={14} className="mr-1" />
        Play
      </Button>

      <Button variant="secondary" size="sm" onClick={handleAddToPlaylist} disabled={!parsed?.valid}>
        <Plus size={14} />
      </Button>
    </div>
  );
}