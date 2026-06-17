/**
 * Loading Skeleton Component.
 * Displays animated placeholder content while data is loading.
 * Supports text, circular, and rectangular variants with pulse or wave animations.
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base placeholder block used by the predefined skeleton layouts.
 */
export default function LoadingSkeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-800/40 backdrop-blur-md shadow-inner border border-white/5';
  
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse duration-1000',
    wave: 'shimmer before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent relative overflow-hidden',
    none: ''
  };
  
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem'
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Predefined skeleton layouts for common use cases
export function AlertCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between mb-3">
      <div className="flex items-center gap-4 flex-1">
        <LoadingSkeleton width={40} height={40} variant="rectangular" className="rounded-lg" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton width="40%" height={18} />
          <LoadingSkeleton width="60%" height={14} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LoadingSkeleton width={40} height={24} variant="text" />
        <LoadingSkeleton width={24} height={24} variant="circular" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <LoadingSkeleton width={60} height={28} className="mb-1" />
      <LoadingSkeleton width={100} height={16} className="opacity-60" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-800">
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingSkeleton key={i} height={16} className="flex-1" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Alert List */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <LoadingSkeleton variant="circular" width={80} height={80} />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton width={150} height={24} />
        <LoadingSkeleton width={200} height={16} />
        <LoadingSkeleton width={100} height={14} />
      </div>
    </div>
  );
}

export function PricingCardSkeleton({ popular = false }: { popular?: boolean }) {
  return (
    <div className={`relative bg-gray-800 rounded-2xl p-8 border ${popular ? 'border-purple-500' : 'border-gray-700'}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <LoadingSkeleton width={100} height={24} />
        </div>
      )}
      <LoadingSkeleton width={100} height={32} className="mb-4" />
      <LoadingSkeleton width={80} height={48} className="mb-6" />
      <div className="space-y-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} width="80%" height={16} />
        ))}
      </div>
      <LoadingSkeleton width="100%" height={48} />
    </div>
  );
}
