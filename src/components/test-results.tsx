import React from 'react';
import ResultsDisplay from './results-display';

const TestResults: React.FC = () => {
  const mockResults = [
    {
      name: "Sarthak Gautam",
      status: "SUCCESS - Attendance marked successfully for today's session",
      success: true,
    },
    {
      name: "Mohit Yadav",
      status: "Error - Authentication failed: Invalid credentials provided. Please check username and password",
      success: false,
    },
    {
      name: "Prajwal Baluni",
      status: "SUCCESS - Attendance recorded",
      success: true,
    },
    {
      name: "Suryansh Dhatwalia",
      status: "Error - Network timeout occurred while trying to connect to the Bennett ERP system. Please try again later",
      success: false,
    },
  ];

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Text Wrapping Test</h2>
      <ResultsDisplay results={mockResults} isProcessing={false} />
    </div>
  );
};

export default TestResults;