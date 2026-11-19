import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WallpaperSettingPanel } from "./WallpaperSettingPanel";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>背景设置</DialogTitle>
        </DialogHeader>
        <WallpaperSettingPanel />
      </DialogContent>
    </Dialog>
  );
}
