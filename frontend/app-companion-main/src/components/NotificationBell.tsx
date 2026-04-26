import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useApp, type Notification } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative h-10 w-10 rounded-full glass hover:bg-secondary/80 transition-smooth flex items-center justify-center"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground flex items-center justify-center animate-pulse-glow">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0 glass border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            notifications.map((n) => <NotificationItem key={n.id} n={n} onRead={markAsRead} />)
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const Icon = iconMap[n.type];
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 border-b border-border/50 transition-smooth hover:bg-secondary/40",
        !n.read && "bg-primary/5"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center",
          n.type === "success" && "bg-success/15 text-success",
          n.type === "info" && "bg-primary/15 text-primary",
          n.type === "warning" && "bg-destructive/15 text-destructive"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium truncate">{n.title}</p>
          {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">{n.time}</span>
          {!n.read && (
            <button
              onClick={() => onRead(n.id)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
