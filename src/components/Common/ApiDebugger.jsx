import { useState } from 'react';
import { getDetailedRooms } from '../../services/roomService';
import BookingTest from '../Test/BookingTest';
import BackendTest from '../Test/BackendTest';
import TokenDebugger from '../Test/TokenDebugger';
import PermissionsTest from '../Test/PermissionsTest';

const ApiDebugger = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      const result = await getDetailedRooms();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        data: null
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🔧 API Debugger</h2>
        
        <button
          onClick={testApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {loading ? 'Testing...' : 'Test /api/rooms/detailed'}
        </button>

        {result && (
          <div className="space-y-4">
            <div className={`p-3 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold">Result:</h3>
              <p>Success: {result.success ? '✅' : '❌'}</p>
              {result.error && <p>Error: {result.error}</p>}
              <p>Data length: {result.data ? result.data.length : 0}</p>
            </div>

            {result.data && result.data.length > 0 && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-semibold mb-2">Sample Data (First Room):</h3>
                <pre className="text-xs overflow-auto max-h-60 bg-gray-50 p-2 rounded">
                  {JSON.stringify(result.data[0], null, 2)}
                </pre>
              </div>
            )}

            <details className="bg-white p-3 rounded border">
              <summary className="font-semibold cursor-pointer">Full Raw Response</summary>
              <pre className="text-xs overflow-auto max-h-80 bg-gray-50 p-2 rounded mt-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>📌 Questo debugger ti aiuta a vedere esattamente cosa restituisce l'API</p>
          <p>🔍 Controlla la console del browser per i log dettagliati</p>
        </div>
      </div>
      
      {/* Test Permessi e Autorizzazioni */}
      <PermissionsTest />
      
      {/* Token JWT Debugger */}
      <TokenDebugger />
      
      {/* Test Connessione Backend */}
      <BackendTest />
      
      {/* Test Sistema Prenotazioni */}
      <BookingTest />
    </div>
  );
};

export default ApiDebugger;
