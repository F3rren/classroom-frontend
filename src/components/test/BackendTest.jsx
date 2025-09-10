import { useState } from 'react';

const BackendTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setResult(null);
    
    const tests = [
      {
        name: "Test connessione backend",
        url: "/api/health",
        method: "GET"
      },
      {
        name: "Test endpoint stanze",
        url: "/api/rooms",
        method: "GET",
        requiresAuth: true
      },
      {
        name: "Test endpoint disponibilità (formato corretto)",
        url: "/api/prenotazioni/disponibilita?aulaId=1&inizio=2025-09-10T08:00:00&fine=2025-09-10T09:00:00",
        method: "GET",
        requiresAuth: true
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const headers = {
          "Content-Type": "application/json"
        };

        if (test.requiresAuth) {
          const token = localStorage.getItem("token");
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        }

        console.log(`🧪 Testing: ${test.name} - ${test.url}`);
        
        const response = await fetch(test.url, {
          method: test.method,
          headers
        });

        const text = await response.text();
        
        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          hasContent: !!text,
          contentLength: text.length,
          content: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
          isJSON: (() => {
            try {
              JSON.parse(text);
              return true;
            } catch {
              return false;
            }
          })()
        });

      } catch (error) {
        results.push({
          name: test.name,
          url: test.url,
          error: error.message,
          success: false
        });
      }
    }

    setResult(results);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🔍 Test Connessione Backend</h3>
      
      <button
        onClick={testBackendConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testando...' : 'Testa Connessione Backend'}
      </button>

      {result && (
        <div className="space-y-4">
          {result.map((test, index) => (
            <div key={index} className={`p-4 rounded-md border ${
              test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{test.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {test.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              
              <div className="text-sm space-y-1">
                <div><strong>URL:</strong> {test.url}</div>
                {test.status && <div><strong>Status:</strong> {test.status} {test.statusText}</div>}
                {test.error && <div><strong>Errore:</strong> {test.error}</div>}
                {test.hasContent !== undefined && (
                  <div><strong>Ha contenuto:</strong> {test.hasContent ? '✅' : '❌'}</div>
                )}
                {test.isJSON !== undefined && (
                  <div><strong>È JSON:</strong> {test.isJSON ? '✅' : '❌'}</div>
                )}
                {test.contentLength !== undefined && (
                  <div><strong>Lunghezza:</strong> {test.contentLength} caratteri</div>
                )}
              </div>

              {test.content && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium text-sm">Visualizza risposta</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                    {test.content}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <h4 className="font-medium mb-1">💡 Suggerimenti:</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Se tutti i test falliscono, il backend probabilmente non è in esecuzione</li>
          <li>Se solo i test con autenticazione falliscono, controlla il token di login</li>
          <li>Se ricevi errori 404, l'endpoint potrebbe non essere implementato</li>
          <li>Controlla la console del browser per errori di rete dettagliati</li>
        </ul>
      </div>
    </div>
  );
};

export default BackendTest;
