import { useState } from 'react';

const TokenDebugger = () => {
  const [tokenInfo, setTokenInfo] = useState(null);

  const decodeJWT = (token) => {
    try {
      // Dividiamo il token nelle sue parti
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { error: 'Token JWT malformato' };
      }

      // Decodifichiamo l'header
      const header = JSON.parse(atob(parts[0]));
      
      // Decodifichiamo il payload
      const payload = JSON.parse(atob(parts[1]));
      
      // Calcoliamo la scadenza
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      const expiresIn = payload.exp ? payload.exp - now : null;

      return {
        header,
        payload,
        isExpired,
        expiresIn,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : null
      };
    } catch (error) {
      return { error: `Errore nella decodifica: ${error.message}` };
    }
  };

  const analyzeToken = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setTokenInfo({ error: 'Nessun token trovato nel localStorage' });
      return;
    }

    const decoded = decodeJWT(token);
    setTokenInfo({
      raw: token,
      decoded,
      length: token.length
    });
  };

  const testAuthenticatedEndpoint = async () => {
    const token = localStorage.getItem('token');
    
    try {
      console.log('🔐 Testing authenticated endpoint with token:', token?.substring(0, 20) + '...');
      
      const response = await fetch('/api/rooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Auth test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const text = await response.text();
      console.log('📄 Auth test content:', text.substring(0, 200));

      setTokenInfo(prev => ({
        ...prev,
        authTest: {
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          content: text.substring(0, 500)
        }
      }));

    } catch (error) {
      console.error('❌ Auth test error:', error);
      setTokenInfo(prev => ({
        ...prev,
        authTest: {
          error: error.message
        }
      }));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🔐 JWT Token Debugger</h3>
      
      <div className="flex space-x-3 mb-4">
        <button
          onClick={analyzeToken}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Analizza Token JWT
        </button>
        
        <button
          onClick={testAuthenticatedEndpoint}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Test Endpoint Autenticato
        </button>
      </div>

      {tokenInfo && (
        <div className="space-y-4">
          {tokenInfo.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-800">Errore:</h4>
              <p className="text-red-700">{tokenInfo.error}</p>
            </div>
          )}

          {tokenInfo.raw && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <h4 className="font-medium mb-2">Token Info:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Lunghezza:</strong> {tokenInfo.length} caratteri</div>
                  <div><strong>Primi 50 caratteri:</strong> <code className="bg-gray-100 px-1 rounded">{tokenInfo.raw.substring(0, 50)}...</code></div>
                </div>
              </div>

              {tokenInfo.decoded && !tokenInfo.decoded.error && (
                <div className="space-y-3">
                  <div className={`p-3 border rounded ${
                    tokenInfo.decoded.isExpired 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h4 className="font-medium mb-2">Stato Token:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Scaduto:</strong> {tokenInfo.decoded.isExpired ? '❌ Sì' : '✅ No'}</div>
                      {tokenInfo.decoded.expiresAt && (
                        <div><strong>Scade il:</strong> {tokenInfo.decoded.expiresAt}</div>
                      )}
                      {tokenInfo.decoded.expiresIn && (
                        <div><strong>Scade tra:</strong> {tokenInfo.decoded.expiresIn > 0 ? `${tokenInfo.decoded.expiresIn} secondi` : 'Già scaduto'}</div>
                      )}
                      {tokenInfo.decoded.issuedAt && (
                        <div><strong>Emesso il:</strong> {tokenInfo.decoded.issuedAt}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium mb-2">Payload JWT:</h4>
                    <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                      {JSON.stringify(tokenInfo.decoded.payload, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <h4 className="font-medium mb-2">Header JWT:</h4>
                    <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                      {JSON.stringify(tokenInfo.decoded.header, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {tokenInfo.decoded?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-medium text-red-800">Errore decodifica:</h4>
                  <p className="text-red-700">{tokenInfo.decoded.error}</p>
                </div>
              )}
            </div>
          )}

          {tokenInfo.authTest && (
            <div className={`p-3 border rounded ${
              tokenInfo.authTest.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h4 className="font-medium mb-2">Test Autenticazione:</h4>
              <div className="text-sm space-y-1">
                <div><strong>Status:</strong> {tokenInfo.authTest.status} {tokenInfo.authTest.statusText}</div>
                <div><strong>Successo:</strong> {tokenInfo.authTest.success ? '✅' : '❌'}</div>
                {tokenInfo.authTest.error && <div><strong>Errore:</strong> {tokenInfo.authTest.error}</div>}
              </div>
              
              {tokenInfo.authTest.content && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Risposta del server</summary>
                  <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-32">
                    {tokenInfo.authTest.content}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <h4 className="font-medium mb-1">💡 Cosa fare se il token è scaduto:</h4>
        <ol className="list-decimal list-inside space-y-1 text-yellow-800">
          <li>Effettua il logout e riaccedi</li>
          <li>Il sistema dovrebbe generare un nuovo token</li>
          <li>Se il problema persiste, controlla la configurazione del backend</li>
        </ol>
      </div>
    </div>
  );
};

export default TokenDebugger;
