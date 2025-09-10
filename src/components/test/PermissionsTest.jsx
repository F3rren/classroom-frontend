import { useState } from 'react';

const PermissionsTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    setResults([]);

    const token = localStorage.getItem('token');
    if (!token) {
      setResults([{ endpoint: 'Token Check', error: 'Nessun token trovato' }]);
      setLoading(false);
      return;
    }

    const endpointsToTest = [
      { name: 'Test Connessione Base', url: '/api/test', method: 'GET', description: 'Endpoint di test base' },
      { name: 'Stanze Base', url: '/api/rooms', method: 'GET', description: 'Lista stanze base' },
      { name: 'Stanze Dettagliate', url: '/api/rooms/detailed', method: 'GET', description: 'Lista stanze con dettagli' },
      { name: 'Singola Stanza', url: '/api/rooms/1/detailed', method: 'GET', description: 'Dettagli stanza specifica' },
      { name: 'Tutte le Prenotazioni', url: '/api/prenotazioni', method: 'GET', description: 'Lista tutte le prenotazioni (admin)' },
      { name: 'Le Mie Prenotazioni', url: '/api/prenotazioni/mie', method: 'GET', description: 'Le mie prenotazioni' },
      { name: 'Verifica Disponibilità', url: '/api/prenotazioni/disponibilita?aulaId=1&inizio=2025-09-10T08:00:00&fine=2025-09-10T09:00:00', method: 'GET', description: 'Verifica disponibilità stanza (formato corretto)' },
      { name: 'Test Prenotazione (DRY RUN)', url: '/api/prenotazioni/prenota', method: 'POST', body: { aulaId: 1, corsoId: 1, inizio: '2025-09-10T08:00:00', fine: '2025-09-10T09:00:00', descrizione: 'Test prenotazione' }, description: 'Prova prenotazione con parametri corretti' }
    ];

    const testResults = [];

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🧪 Testing: ${endpoint.name}`);
        
        const options = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await fetch(endpoint.url, options);
        const text = await response.text();

        testResults.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          description: endpoint.description,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          hasContent: !!text,
          content: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          // Analisi specifica per errori di autorizzazione
          authIssue: response.status === 401 ? 'Token non valido' : 
                    response.status === 403 ? 'Permessi insufficienti' : 
                    response.status === 404 ? 'Endpoint non trovato' : null
        });

        // Piccola pausa tra le richieste
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        testResults.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          description: endpoint.description,
          error: error.message,
          success: false
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const testWorkingEndpoint = async () => {
    setLoading(true);
    setResults([]);

    const token = localStorage.getItem('token');
    
    try {
      console.log('🧪 Testing known working endpoint: /api/rooms/detailed');
      
      const response = await fetch('/api/rooms/detailed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const text = await response.text();
      console.log('📡 Working endpoint response:', {
        status: response.status,
        hasContent: !!text,
        contentPreview: text.substring(0, 100)
      });

      setResults([{
        endpoint: 'Test Endpoint Funzionante',
        url: '/api/rooms/detailed',
        method: 'GET',
        description: 'Questo endpoint dovrebbe funzionare se il sistema è configurato correttamente',
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        hasContent: !!text,
        content: text,
        authIssue: response.status === 401 ? 'Token non valido' : 
                  response.status === 403 ? 'Permessi insufficienti' : 
                  response.status === 404 ? 'Endpoint non trovato' : null
      }]);

    } catch (error) {
      setResults([{
        endpoint: 'Test Endpoint Funzionante',
        url: '/api/rooms/detailed',
        method: 'GET',
        description: 'Questo endpoint dovrebbe funzionare se il sistema è configurato correttamente',
        error: error.message,
        success: false
      }]);
    }

    setLoading(false);
  };

  const refreshToken = () => {
    // Simuliamo un refresh forzando un nuovo login
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🔒 Test Permessi e Autorizzazioni</h3>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={testEndpoints}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testa Tutti gli Endpoint'}
        </button>
        
        <button
          onClick={testWorkingEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testa Endpoint Sicuro'}
        </button>
        
        <button
          onClick={refreshToken}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Forza Nuovo Login
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Risultati Test:</h4>
          
          {results.map((result, index) => (
            <div key={index} className={`p-3 border rounded-md ${
              result.success ? 'bg-green-50 border-green-200' : 
              result.authIssue ? 'bg-red-50 border-red-200' : 
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="font-medium">{result.endpoint}</h5>
                  {result.description && (
                    <p className="text-xs text-gray-600">{result.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {result.method && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {result.method}
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    result.success ? 'bg-green-100 text-green-800' : 
                    result.authIssue ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status || 'ERROR'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm space-y-1">
                {result.url && (
                  <div><strong>URL:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{result.url}</code></div>
                )}
                {result.statusText && (
                  <div><strong>Status:</strong> {result.status} {result.statusText}</div>
                )}
                {result.authIssue && (
                  <div className="text-red-700"><strong>Problema:</strong> {result.authIssue}</div>
                )}
                {result.error && (
                  <div className="text-red-700"><strong>Errore:</strong> {result.error}</div>
                )}
              </div>

              {result.content && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Visualizza risposta</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                    {result.content}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <h4 className="font-medium mb-1">🔍 Diagnosi Errori Comuni:</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li><strong>401 Unauthorized:</strong> Token JWT non valido o scaduto</li>
          <li><strong>403 Forbidden:</strong> Token valido ma permessi insufficienti</li>
          <li><strong>404 Not Found:</strong> Endpoint non implementato sul backend</li>
          <li><strong>500 Internal Server Error:</strong> Errore del server backend</li>
        </ul>
      </div>
    </div>
  );
};

export default PermissionsTest;
