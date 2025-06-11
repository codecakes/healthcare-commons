import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DebugInfo {
  message: string;
  developmentMode: boolean;
  environment: {
    frontendUrl: string;
    port: string;
  };
  requestOrigin: string;
}

/**
 * Debug panel for development - only shown when in development mode
 */
const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get server endpoint from environment or use default
  const serverEndpoint = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  const debugEndpoint = `${serverEndpoint}/api/debug`;
  
  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Configure fetch request to match CORS policy
      const response = await fetch(debugEndpoint, {
        method: 'GET',
        mode: 'cors',
        // Don't send credentials for debug endpoint
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      console.error('Debug fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically fetch debug info on mount
    fetchDebugInfo();
  }, []);

  return (
    <Card className="mb-6 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-yellow-800">Development Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-yellow-600">Loading debug info...</p>
        ) : error ? (
          <div>
            <p className="text-xs text-red-600 mb-2">Error: {error}</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={fetchDebugInfo}
            >
              Retry
            </Button>
          </div>
        ) : debugInfo ? (
          <div className="text-xs">
            <div className="grid grid-cols-2 gap-1 mb-2">
              <span className="font-medium">Server Status:</span>
              <span>{debugInfo.message}</span>
              
              <span className="font-medium">Development Mode:</span>
              <span>{debugInfo.developmentMode ? 'Enabled' : 'Disabled'}</span>
              
              <span className="font-medium">Frontend URL:</span>
              <span>{debugInfo.environment.frontendUrl || 'Not set'}</span>
              
              <span className="font-medium">Server Port:</span>
              <span>{debugInfo.environment.port || '3001 (default)'}</span>
              
              <span className="font-medium">Request Origin:</span>
              <span>{debugInfo.requestOrigin}</span>
            </div>
            <p className="text-xs text-green-600">API connection successful</p>
          </div>
        ) : (
          <p className="text-xs text-yellow-600">No debug info available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;