import { ComponentType } from 'react';

interface EmptyStateProps {
  icon: ComponentType<any>;
  title: string;
  description: string;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="status"
      aria-labelledby="empty-state-title"
    >
      <div 
        className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner"
        aria-hidden="true"
      >
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 id="empty-state-title" className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25"
        >
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
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )}
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
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
      title="No Notifications"
      description="You're all caught up! We'll notify you when something interesting happens on the blockchain."
    />
  );
}

export function NoUsersState() {
  return (
    <EmptyState
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      title="No Users Yet"
      description="Users will appear here once they register and subscribe to your alerts."
    />
  );
}

export function NoTransactionsState() {
  return (
    <EmptyState
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )}
      title="No Transactions"
      description="Your transaction history will appear here once you start using the platform."
    />
  );
}

export function NoResultsState({ onClearFilter }: { onClearFilter?: () => void }) {
  return (
    <EmptyState
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
      title="No Results Found"
      description="We couldn't find anything matching your search criteria. Try adjusting your filters."
      action={onClearFilter ? {
        label: 'Clear Filters',
        onClick: onClearFilter
      } : undefined}
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={(props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      title="Something Went Wrong"
      description={message || "We encountered an error while loading this data. Please try again."}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry
      } : undefined}
    />
  );
}
