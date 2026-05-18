import { memo, useCallback } from 'react';
import { 
  Loader2, 
  ToggleLeft, 
  ToggleRight, 
  Trash2,
  LucideIcon
} from 'lucide-react';

interface AlertCardProps {
  alert: {
    id: number;
    type: number;
    name: string;
    enabled: boolean;
    triggerCount: number;
    description?: string;
  };
  alertType?: {
    icon: LucideIcon;
    description: string;
  };
  isSyncing: boolean;
  index: number;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const AlertCard = memo(({ 
  alert, 
  alertType, 
  isSyncing, 
  index, 
  onToggle, 
  onDelete 
}: AlertCardProps) => {
  const handleToggle = useCallback(() => onToggle(alert.id), [onToggle, alert.id]);
  const handleDelete = useCallback(() => onDelete(alert.id), [onDelete, alert.id]);
  return (
    <div 
      className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between animate-slide-up hover:border-purple-500/50 transition-colors"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.enabled ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
          {alertType && <alertType.icon className={`w-5 h-5 ${alert.enabled ? 'text-purple-400' : 'text-gray-500'}`} />}
        </div>
        <div>
          <h4 className={`font-semibold ${alert.enabled ? 'text-white' : 'text-gray-500'}`}>{alert.name}</h4>
          <p className="text-gray-500 text-sm">
            {alertType?.description} • {alert.triggerCount} triggers
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="p-2 hover:bg-gray-700 rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
          aria-pressed={alert.enabled}
          aria-label={alert.enabled ? 'Disable alert' : 'Enable alert'}
          title={alert.enabled ? 'Disable alert' : 'Enable alert'}
        >
          {isSyncing ? (
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          ) : alert.enabled ? (
            <ToggleRight className="w-6 h-6 text-green-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-500" />
          )}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
          aria-label="Delete alert"
          title="Delete alert"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  );
});

AlertCard.displayName = 'AlertCard';

export default AlertCard;
