// client/src/components/chat/Avatar.jsx

import { getAvatarColor, getInitials } from '../../utils/generateAvatar';

export function Avatar({ name, size = 32 }) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
}