import { useState } from 'react';

const EndpointTester = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const token = localStorage.getItem('token');
    
    const endpointsToTest = [
      { name: 'Admin Rooms List', url: '/api/admin/rooms', method: 'GET' },
      { name: 'Admin Room Block', url: '/api/admin/rooms/1/block', method: 'PUT' },
      { name: 'Admin Room Update', url: '/api/admin/rooms/1', method: 'PUT' },
      { name: 'Rooms Block (no admin)', url: '/api/rooms/1/block', method: 'PUT' },
      { name: 'Rooms Update (no admin)', url: '/api/rooms/1', method: 'PUT' },
      { name: 'Admin User Info', url: '/api/admin/me', method: 'GET' },
      { name: 'Current User Info', url: '/api/me', method: 'GET' },
    ];

    const testResults = {};

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🧪 Testing ${endpoint.name}: ${endpoint.method} ${endpoint.url}`);
        
        const options = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };

        // Per le PUT aggiungiamo un body di test
        if (endpoint.method === 'PUT') {
          options.body = JSON.stringify({
            isBlocked: true,
            blockReason: "Test endpoint"
          });
        }

        const response = await fetch(endpoint.url, options);
        
        let content = '';
        try {
          content = await response.text();
        } catch (e) {
          content = 'Impossibile leggere contenuto';
        }

        testResults[endpoint.name] = {
          status: response.status,
          statusText: response.statusText,
          contentPreview: content.substring(0, 200),
          success: response.ok
        };

        console.log(`🧪 ${endpoint.name}: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        testResults[endpoint.name] = {
          status: 'ERROR',
          statusText: error.message,
          contentPreview: '',
          success: false
        };
        console.error(`🧪 Errore ${endpoint.name}:`, error);
      }
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🧪 Test Endpoints</h3>
      
      <button
        onClick={testEndpoints}
        disabled={testing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {testing ? 'Testing...' : 'Test All Endpoints'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Risultati:</h4>
          <div className="space-y-2">
            {Object.entries(results).map(([name, result]) => (
              <div key={name} className="border rounded p-2 bg-white">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{name}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status} {result.statusText}
                  </span>
                </div>
                {result.contentPreview && (
                  <div className="text-xs text-gray-600 mt-1">
                    {result.contentPreview}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointTester;
