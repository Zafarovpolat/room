// client/src/components/ui/Spinner.jsx

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  
  return (
    <div className={`${sizes[size]} border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin`} />
  );
}