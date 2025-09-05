import Navbar from "./Navbar";

export default function MainLayout({currentPage, children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {currentPage === 'admin' ? 'Pannello Amministrazione' : 'Sistema di Prenotazione Aule'}
          </h2>
          <div className="bg-white rounded-lg shadow p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
