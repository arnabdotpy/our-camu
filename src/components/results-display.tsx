import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  User,
  Calendar,
  Shield,
  Database,
  WifiSlash,
  Question
} from 'phosphor-react';

interface Result {
  name: string;
  status: string;
  success: boolean;
}

interface ResultsDisplayProps {
  results: Result[];
  isProcessing: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  isProcessing,
}) => {
  // Format status messages and get appropriate icons
  const formatStatusMessage = (status: string, success: boolean) => {
    const statusUpper = status.toUpperCase();
    
    // Success cases
    if (success || statusUpper === 'SUCCESS') {
      return {
        message: 'Success',
        icon: <CheckCircle size={20} className="text-green-500" />,
        isSuccess: true
      };
    }
    
    // Error cases with specific icons and messages
    const errorMappings: Record<string, { message: string; icon: JSX.Element }> = {
      'ATTENDANCE_NOT_VALID': {
        message: 'Attendance Not Valid',
        icon: <Warning size={20} className="text-orange-500" />
      },
      'USER_NOT_FOUND': {
        message: 'User Not Found',
        icon: <User size={20} className="text-red-500" />
      },
      'ALREADY_MARKED': {
        message: 'Already Marked',
        icon: <Clock size={20} className="text-blue-500" />
      },
      'INVALID_QR_CODE': {
        message: 'Invalid QR Code',
        icon: <XCircle size={20} className="text-red-500" />
      },
      'SESSION_EXPIRED': {
        message: 'Session Expired',
        icon: <Clock size={20} className="text-orange-500" />
      },
      'PERMISSION_DENIED': {
        message: 'Permission Denied',
        icon: <Shield size={20} className="text-red-500" />
      },
      'DATABASE_ERROR': {
        message: 'Database Error',
        icon: <Database size={20} className="text-red-500" />
      },
      'NETWORK_ERROR': {
        message: 'Network Error',
        icon: <WifiSlash size={20} className="text-red-500" />
      },
      'INVALID_DATE': {
        message: 'Invalid Date',
        icon: <Calendar size={20} className="text-orange-500" />
      },
      'TIMEOUT': {
        message: 'Request Timeout',
        icon: <Clock size={20} className="text-orange-500" />
      }
    };
    
    // Check if we have a specific mapping
    if (errorMappings[statusUpper]) {
      return {
        message: errorMappings[statusUpper].message,
        icon: errorMappings[statusUpper].icon,
        isSuccess: false
      };
    }
    
    // Fallback: convert snake_case to Title Case
    const formattedMessage = status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      message: formattedMessage,
      icon: <Question size={20} className="text-gray-500" />,
      isSuccess: false
    };
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setIsAtTop(scrollTop === 0);
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1); // -1 for potential float inaccuracies
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
       const checkScrollable = () => {
        const isCurrentlyScrollable = scrollElement.scrollHeight > scrollElement.clientHeight;
        setIsScrollable(isCurrentlyScrollable);
        
        // If not scrollable, ensure we're marked as both at top and bottom
        if (!isCurrentlyScrollable) {
          setIsAtTop(true);
          setIsAtBottom(true);
        } else {
          handleScroll(); // Initial scroll position check
        }
      };
      
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(checkScrollable, 0);
      
      scrollElement.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', checkScrollable); // Recalculate on resize
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScrollable);
      };
    }
  }, [results]); // Re-check when results change

  if (!isProcessing && results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Scan a QR code to mark attendance</p>
      </div>
    );
  }

  const scrollGradientClasses = () => {
    if (!isScrollable) return '';
    
    // Show gradients to indicate where there's more content
    // If at top: show top gradient (indicating content above)
    // If at bottom: show bottom gradient (indicating content below)
    // If in middle: show both gradients
    if (isAtTop && !isAtBottom) return 'scroll-gradient-top';
    if (isAtBottom && !isAtTop) return 'scroll-gradient-bottom';
    if (!isAtTop && !isAtBottom) return 'scroll-gradient-both';
    return '';
  };

  return (
    <div className="space-y-4 relative">
      {isProcessing && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/10">
          <span className="text-primary font-medium">Processing attendance...</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`max-h-96 overflow-y-auto space-y-2 pr-2 ${scrollGradientClasses()}`}
      >
        {results.map((result, index) => {
          const statusInfo = formatStatusMessage(result.status, result.success);
          
          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                statusInfo.isSuccess
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-destructive/10 border-destructive/20'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {statusInfo.icon}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-sm leading-tight break-words">{result.name}</p>
                <p className={`text-xs leading-tight break-words ${
                  statusInfo.isSuccess ? 'text-green-400' : 'text-destructive-foreground'
                }`}>
                  {statusInfo.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {results.length > 0 && !isProcessing && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {results.filter(r => r.success).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Successful
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {results.filter(r => !r.success).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Failed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
