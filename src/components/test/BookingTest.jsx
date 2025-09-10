import { useState } from 'react';
import { createBooking, checkAvailability } from '../../services/bookingService';

const BookingTest = () => {
  const [testData, setTestData] = useState({
    roomId: '1',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    purpose: 'Test prenotazione',
    corsoId: '1'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleTestAvailability = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const availabilityResult = await checkAvailability(
        testData.roomId, 
        testData.date, 
        testData.startTime, 
        testData.endTime
      );
      
      setResult({
        type: 'availability',
        data: availabilityResult
      });
    } catch (error) {
      setResult({
        type: 'error',
        data: { message: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestBooking = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const bookingResult = await createBooking(testData);
      
      setResult({
        type: 'booking',
        data: bookingResult
      });
    } catch (error) {
      setResult({
        type: 'error',
        data: { message: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestRawEndpoint = async () => {
    setLoading(true);
    setResult(null);
    setDebugInfo(null);
    
    try {
      const params = new URLSearchParams({
        aulaId: testData.roomId.toString(),
        inizio: `${testData.date}T${testData.startTime}:00`,
        fine: `${testData.date}T${testData.endTime}:00`
      });

      const response = await fetch(`/api/prenotazioni/disponibilita?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      const text = await response.text();
      
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
        isJSON: (() => {
          try {
            JSON.parse(text);
            return true;
          } catch {
            return false;
          }
        })()
      });

      if (response.ok) {
        setResult({
          type: 'raw-success',
          data: { message: 'Test completato con successo', response: text }
        });
      } else {
        setResult({
          type: 'raw-error',
          data: { message: `Errore HTTP ${response.status}: ${response.statusText}`, response: text }
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        data: { message: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Test Sistema Prenotazioni</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aula ID
          </label>
          <input
            type="text"
            value={testData.roomId}
            onChange={(e) => setTestData(prev => ({...prev, roomId: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            value={testData.date}
            onChange={(e) => setTestData(prev => ({...prev, date: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Corso ID
          </label>
          <input
            type="number"
            value={testData.corsoId}
            onChange={(e) => setTestData(prev => ({...prev, corsoId: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ora inizio
          </label>
          <input
            type="time"
            value={testData.startTime}
            onChange={(e) => setTestData(prev => ({...prev, startTime: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ora fine
          </label>
          <input
            type="time"
            value={testData.endTime}
            onChange={(e) => setTestData(prev => ({...prev, endTime: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione
        </label>
        <textarea
          value={testData.purpose}
          onChange={(e) => setTestData(prev => ({...prev, purpose: e.target.value}))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex space-x-3 mb-4">
        <button
          onClick={handleTestAvailability}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Test Disponibilità'}
        </button>
        
        <button
          onClick={handleTestBooking}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Prenotando...' : 'Test Prenotazione'}
        </button>

        <button
          onClick={handleTestRawEndpoint}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Raw Endpoint'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-md ${
          result.data.success === false ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          <h4 className="font-medium mb-2">
            Risultato {result.type === 'availability' ? 'Verifica Disponibilità' : result.type === 'booking' ? 'Prenotazione' : 'Test Raw'}:
          </h4>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo && (
        <div className="p-4 rounded-md bg-blue-50 border border-blue-200 mt-4">
          <h4 className="font-medium mb-2">Informazioni Debug Endpoint:</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {debugInfo.status} {debugInfo.statusText}</div>
            <div><strong>È JSON valido:</strong> {debugInfo.isJSON ? '✅ Sì' : '❌ No'}</div>
            <div><strong>Lunghezza risposta:</strong> {debugInfo.body.length} caratteri</div>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Headers</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(debugInfo.headers, null, 2)}
              </pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Corpo risposta raw</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                {debugInfo.body || '(vuoto)'}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTest;
