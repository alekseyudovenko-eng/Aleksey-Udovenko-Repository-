import React from 'react';

interface PriceInfo {
  price: number;
  change: number;
  changePercent: number;
}

interface DashboardHeaderProps {
  priceInfo: PriceInfo;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('MYR', 'RM');
};

const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-200 animate-pulse rounded-md ${className}`}></div>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ priceInfo, isLoading, onRefresh }) => {
  const isPositive = priceInfo.change >= 0;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Crude Palm Oil Futures (FCPO)
        </h1>
        <p className="text-gray-500 mt-1">Real-time simulated price data</p>
      </div>
      <div className="flex items-center gap-4 mt-4 sm:mt-0">
         {isLoading ? (
          <div className="text-right">
            <SkeletonLoader className="h-8 w-40 mb-2" />
            <SkeletonLoader className="h-6 w-32" />
          </div>
        ) : (
          <div className="text-right">
            <p className="text-3xl font-semibold text-gray-900">
              {formatCurrency(priceInfo.price)}
            </p>
            <p className={`text-lg font-medium ${isPositive ? 'text-brand-green' : 'text-brand-red'}`}>
              {isPositive ? '+' : ''}{formatCurrency(priceInfo.change).replace('RM','')} ({isPositive ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%)
            </p>
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-full bg-light-primary hover:bg-light-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Refresh data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5M12 4v16"
              transform="rotate(90 12 12)"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;