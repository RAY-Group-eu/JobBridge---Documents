import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LockScreen from './components/LockScreen';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';
import { Menu } from 'lucide-react';

interface DocItem {
  id: string;
  filename: string;
  path: string;
  title: string;
}

function App() {
  const { isAuthenticated, login, logout, attempts, lockoutUntil } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [currentDoc, setCurrentDoc] = useState<DocItem | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingDocs(true);
      fetch('/docs-manifest.json')
        .then(res => res.json())
        .then(data => {
          setDocuments(data);
          if (data.length > 0) {
            setCurrentDoc(data[0]);
          }
          setLoadingDocs(false);
        })
        .catch(err => {
          console.error("Failed to load manifest", err);
          setLoadingDocs(false);
        });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LockScreen onLogin={login} attempts={attempts} lockoutUntil={lockoutUntil} />;
  }

  return (
    <div className="app-container">
      {/* Mobile Header / Toggle */}
      <button
        className="mobile-menu-btn glass-btn secondary"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={24} />
      </button>

      <Sidebar
        documents={documents}
        currentDocId={currentDoc?.id || null}
        onSelect={(doc) => setCurrentDoc(doc)}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        {/* Viewer Content */}
        <div className="pdf-container">
          {loadingDocs ? (
            <div className="flex-center h-full w-full text-muted flex-col gap-2">
              <div className="animate-pulse">Loading Library...</div>
            </div>
          ) : currentDoc ? (
            <div className="w-full h-full flex-col">
              <div style={{ marginBottom: '16px', marginLeft: '8px', paddingRight: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>{currentDoc.title}</h2>
                <span className="text-sm text-muted">{currentDoc.filename}</span>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <PDFViewer url={currentDoc.path} />
              </div>
            </div>
          ) : (
            <div className="flex-center h-full w-full text-muted flex-col opacity-50">
              <p>No Document Selected</p>
              <p className="text-sm">Select a file from the sidebar to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
