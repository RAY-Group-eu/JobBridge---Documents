import { Search, FileText, LogOut, X } from 'lucide-react';
import { useState } from 'react';

interface DocItem {
    id: string;
    filename: string;
    path: string;
    title: string;
    size?: number;
}

interface SidebarProps {
    documents: DocItem[];
    currentDocId: string | null;
    onSelect: (doc: DocItem) => void;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ documents, currentDocId, onSelect, onLogout, isOpen, onClose }: SidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, opacity: 0.8 }}>Library</h2>
                    <button
                        className="mobile-only"
                        onClick={onClose}
                        style={{ padding: '8px', background: 'transparent', color: 'var(--text-primary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        className="glass-input"
                        placeholder="Search document..."
                        style={{ paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredDocs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>No documents found</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredDocs.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => {
                                        onSelect(doc);
                                        if (onClose) onClose();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid transparent',
                                        background: currentDocId === doc.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)',
                                        backdropFilter: currentDocId === doc.id ? 'blur(10px)' : 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        color: 'var(--text-primary)',
                                        boxShadow: currentDocId === doc.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                        borderColor: currentDocId === doc.id ? 'var(--glass-border)' : 'transparent',
                                    }}
                                >
                                    <div style={{
                                        background: currentDocId === doc.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        color: currentDocId === doc.id ? 'white' : 'var(--text-secondary)'
                                    }}>
                                        <FileText size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.6 }}>PDF Document</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.5, textAlign: 'center' }}>
                        {documents.length} Files Available
                    </div>
                    <button
                        onClick={onLogout}
                        className="glass-btn secondary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'rgba(255, 59, 48, 0.1)',
                            color: '#ff3b30',
                            borderColor: 'transparent'
                        }}
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
