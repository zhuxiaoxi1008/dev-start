import { useConfig } from '../context/UserConfigContext'
import { getBackgroundStyle } from '../utils/bg'

export function BackgroundLayer() {
  const { settings } = useConfig()
  const style = getBackgroundStyle(settings)

  return (
    <div
      className="fixed inset-0 -z-10"
      style={style}
    />
  )
}
