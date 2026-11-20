import { useConfig } from '@/context/UserConfigContext';
import { getBackgroundStyle } from '@/utils/bg';

export function BackgroundLayer() {
  const { settings } = useConfig();

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={getBackgroundStyle(settings)}
    />
  );
}
