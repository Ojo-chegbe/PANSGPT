import React from 'react';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  BeakerIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

interface CalloutBoxProps {
  type: 'key-concept' | 'example' | 'important' | 'warning' | 'formula';
  title?: string;
  children: React.ReactNode;
}

const CalloutBox: React.FC<CalloutBoxProps> = ({ type, title, children }) => {
  const getIcon = () => {
    switch (type) {
      case 'key-concept':
        return <LightBulbIcon className="callout-icon text-blue-600 dark:text-blue-400" />;
      case 'example':
        return <BeakerIcon className="callout-icon text-green-600 dark:text-green-400" />;
      case 'important':
        return <InformationCircleIcon className="callout-icon text-yellow-600 dark:text-yellow-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="callout-icon text-red-600 dark:text-red-400" />;
      case 'formula':
        return <CalculatorIcon className="callout-icon text-gray-600 dark:text-gray-400" />;
      default:
        return <InformationCircleIcon className="callout-icon text-blue-600 dark:text-blue-400" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'key-concept':
        return 'Key Concept';
      case 'example':
        return 'Example';
      case 'important':
        return 'Important';
      case 'warning':
        return 'Warning';
      case 'formula':
        return 'Formula';
      default:
        return 'Note';
    }
  };

  return (
    <div className={`callout-box callout-${type}`}>
      <div className="callout-title">
        {getIcon()}
        {title || getDefaultTitle()}
      </div>
      <div className="callout-content">
        {children}
      </div>
    </div>
  );
};

export default CalloutBox;
