import { ComponentType } from 'react';
import { Bell, Users, History, Search, AlertTriangle, PlusCircle, BellOff } from 'lucide-react';

/**
 * Props for the EmptyState component.
 */
interface EmptyStateProps {
  /** Icon component to display (from lucide-react) */
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Title text for the empty state */
  title: string;
  /** Description text explaining the empty state */
  description: string;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional action button configuration */
  action?: {
    /** Button label text */
    label: string;
    /** Click handler for the button */
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-zoom-in duration-500 group ${className}`}
      role="status"
      aria-labelledby="empty-state-title"
      aria-describedby="empty-state-description"
      aria-live="polite"
    >
      <div 
        className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-700/50 group-hover:bg-gray-800 group-hover:scale-110 group-hover:shadow-purple-500/10 transition-all duration-500 ease-out"
        aria-hidden="true"
      >
        <Icon className="w-10 h-10 text-gray-400 group-hover:text-purple-400 transition-colors duration-500" strokeWidth={1.5} />
      </div>
      
      <h3 id="empty-state-title" className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p id="empty-state-description" className="text-gray-400 max-w-md mb-8 leading-relaxed">{description}</p>
      
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          {action.label}
        </button>
      )}
    </div>
  );
}

// Predefined empty states for common use cases
export function NoAlertsState({ onCreateAlert }: { onCreateAlert?: () => void }) {
  return (
    <EmptyState
      icon={Bell}
      title="No Alerts Yet"
      description="Create your first alert to start monitoring blockchain events. Get notified instantly when important transactions occur."
      action={onCreateAlert ? {
        label: 'Create Alert',
        onClick: onCreateAlert
      } : undefined}
    />
  );
}

export function NoNotificationsState() {
  return (
    <EmptyState
      icon={BellOff}
      title="No Notifications"
      description="You're all caught up! We'll notify you when something interesting happens on the blockchain."
    />
  );
}

export function NoUsersState() {
  return (
    <EmptyState
      icon={Users}
      title="No Users Yet"
      description="Users will appear here once they register and subscribe to your alerts."
    />
  );
}

export function NoTransactionsState() {
  return (
    <EmptyState
      icon={History}
      title="No Transactions"
      description="Your transaction history will appear here once you start using the platform."
    />
  );
}

export function NoResultsState({ onClearFilter, className }: { onClearFilter?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description="We couldn't find anything matching your search criteria. Try adjusting your filters."
      action={onClearFilter ? {
        label: 'Clear Filters',
        onClick: onClearFilter
      } : undefined}
      className={className}
    />
  );
}

export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something Went Wrong"
      description={message || "We encountered an error while loading this data. Please try again."}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry
      } : undefined}
      className={className}
    />
  );
}
