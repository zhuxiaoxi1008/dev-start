import { useConfig } from "@/context/UserConfigContext"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { UserSettingsPatch } from "@/context/UserConfigContext"

const bgTypeList = [
  { label: "渐变背景", value: "gradient" },
  { label: "纯色背景", value: "solid" },
  { label: "壁纸 A", value: "wallpaperA" },
  { label: "壁纸 B", value: "wallpaperB" },
]

export function WallpaperSettingPanel() {
  const { settings, updateSettings } = useConfig()

  const handleChangeBgType = (v: string) => {
    updateSettings({ bg_type: v as UserSettingsPatch["bg_type"] })
  }

  return (
    <div className="space-y-6">
      {/* 深色模式开关 */}
      <div className="flex items-center justify-between">
        <Label>深色模式</Label>
        <Switch
          checked={settings.dark_mode}
          onCheckedChange={(checked) => updateSettings({ dark_mode: checked })}
        />
      </div>

      <div>
        <Label className="mb-3 block">背景类型</Label>
        <div className="grid grid-cols-2 gap-2">
          {bgTypeList.map((item) => (
            <Button
              key={item.value}
              variant={settings.bg_type === item.value ? "default" : "outline"}
              onClick={() => handleChangeBgType(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {settings.bg_type === "gradient" && (
        <div className="space-y-4">
          <div>
            <Label>渐变色（逗号分隔）</Label>
            <Input
              value={settings.bg_gradient}
              onChange={(e) => updateSettings({ bg_gradient: e.target.value })}
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>渐变角度</Label>
              <span className="text-sm text-muted-foreground">{settings.bg_gradient_angle}°</span>
            </div>
            <Slider
              value={[settings.bg_gradient_angle]}
              min={0}
              max={360}
              step={1}
              onValueChange={(val) => updateSettings({ bg_gradient_angle: val[0] })}
            />
          </div>
        </div>
      )}

      {settings.bg_type === "solid" && (
        <div>
          <Label>纯色</Label>
          <Input
            type="color"
            value={settings.bg_solid_color}
            onChange={(e) => updateSettings({ bg_solid_color: e.target.value })}
            className="h-10"
          />
        </div>
      )}

      {(settings.bg_type === "wallpaperA" || settings.bg_type === "wallpaperB") && (
        <div className="space-y-4">
          <div>
            <Label>壁纸 A 链接</Label>
            <Input
              value={settings.wallpaper}
              onChange={(e) => updateSettings({ wallpaper: e.target.value })}
              placeholder="https://xxx.jpg"
            />
          </div>
          <div>
            <Label>壁纸 B 链接</Label>
            <Input
              value={settings.layout_config.wallpaperB}
              onChange={(e) =>
                updateSettings({
                  layout_config: { ...settings.layout_config, wallpaperB: e.target.value },
                })
              }
              placeholder="https://xxx.jpg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
