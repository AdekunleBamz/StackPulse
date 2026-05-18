import { memo } from 'react';
import { ExternalLink } from 'lucide-react';

interface ActivityItemProps {
  item: {
    id: string;
    message: string;
    timestamp: string;
    txId?: string;
  };
  index: number;
}

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

const ActivityItem = memo(({ item, index }: ActivityItemProps) => {
  const isLatest = index === 0;
  
  return (
    <div 
      className={`bg-gray-800/30 rounded-xl p-4 border ${
        isLatest 
          ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)] ring-1 ring-purple-500/20' 
          : 'border-gray-700/30'
      } flex items-center justify-between group hover:border-purple-500/20 transition-all text-left animate-in fade-in slide-in-from-top-4 duration-700`}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'} shadow-[0_0_8px_rgba(168,85,247,0.4)]`} />
        <div>
          <p className={`text-sm font-medium ${isLatest ? 'text-white' : 'text-gray-300'}`}>{item.message}</p>
          <p className="text-gray-500 text-[10px] mt-0.5 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
      {item.txId && (
        <a 
          href={`https://explorer.hiro.so/txid/${item.txId}?chain=mainnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          onClick={stopPropagation}
          title="Open transaction in Hiro Explorer"
          aria-label={`View transaction ${item.txId} in Hiro Explorer`}
        >
          View Transaction
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

export default ActivityItem;
