import React from 'react';
import type { ComparisonOption } from '../types';

interface ComparisonSelectorProps {
  options: { value: ComparisonOption; label: string }[];
  activeOption: ComparisonOption;
  onSelect: (option: ComparisonOption) => void;
}

const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({ options, activeOption, onSelect }) => {
  return (
    <div className="flex items-center bg-light-secondary p-1 rounded-lg border border-light-tertiary">
      <span className="text-sm font-semibold text-gray-500 mr-2 pl-2 whitespace-nowrap">Compare With:</span>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
            activeOption === option.value
              ? 'bg-brand-blue text-white shadow'
              : 'text-gray-600 hover:bg-light-tertiary hover:text-gray-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ComparisonSelector;
