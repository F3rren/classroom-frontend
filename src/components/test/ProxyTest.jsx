import { useState } from 'react';

const ProxyTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, includeAuth = false) => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log(`🧪 Testing proxy connection to ${endpoint}...`);
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (includeAuth && localStorage.getItem("token")) {
        headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
      }
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: headers,
      });
      
      console.log("📡 Proxy response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      let responseData = '';
      try {
        responseData = await response.text();
      } catch {
        responseData = 'Could not read response body';
      }
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        endpoint: endpoint,
        hasAuth: includeAuth && localStorage.getItem("token"),
        message: response.ok 
          ? "✅ Endpoint accessible!" 
          : `❌ HTTP ${response.status}: ${response.statusText}`
      });
      
    } catch (error) {
      console.error("❌ Errore nel test proxy:", error);
      setResult({
        success: false,
        error: error.message,
        endpoint: endpoint,
        message: "❌ Network error - proxy might not be working"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">🔧 Test Proxy & Endpoints</h3>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => testEndpoint("/api/health")}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Test /api/health
        </button>
        
        <button
          onClick={() => testEndpoint("/api/rooms")}
          disabled={loading}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          Test /api/rooms
        </button>
        
        <button
          onClick={() => testEndpoint("/api/rooms/detailed")}
          disabled={loading}
          className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          Test /api/rooms/detailed
        </button>
        
        <button
          onClick={() => testEndpoint("/api/rooms", true)}
          disabled={loading}
          className="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          Test with Auth
        </button>
      </div>
      
      {loading && (
        <div className="text-blue-600 mb-2">🔄 Testing...</div>
      )}
      
      {result && (
        <div className="bg-white p-3 rounded border">
          <div className="mb-2">
            <span className={`font-semibold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.message}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <p><strong>Endpoint:</strong> {result.endpoint}</p>
            <p><strong>Status:</strong> {result.status} {result.statusText}</p>
            {result.hasAuth && <p><strong>Auth:</strong> ✅ Token included</p>}
            {!result.hasAuth && localStorage.getItem("token") && (
              <p><strong>Auth:</strong> ❌ Token available but not used</p>
            )}
            {!localStorage.getItem("token") && (
              <p><strong>Auth:</strong> ❌ No token in localStorage</p>
            )}
          </div>
          
          {result.data && (
            <div className="mt-2">
              <strong>Response:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                {result.data.substring(0, 1000)}{result.data.length > 1000 ? "\n... (truncated)" : ""}
              </pre>
            </div>
          )}
          
          {result.error && (
            <p className="text-red-600 mt-2"><strong>Error:</strong> {result.error}</p>
          )}
        </div>
      )}
      
      <div className="mt-3 text-xs text-blue-600">
        💡 <strong>Status Guide:</strong> 200=Success, 403=Forbidden/Auth needed, 404=Not found, 500=Server error
      </div>
    </div>
  );
};

export default ProxyTest;
