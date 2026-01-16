import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// WORKER CONFIGURATION
// We use the CDN for specific version to avoid build issues with Vite worker bundling in some envs,
// or use local if configured. For MVP reliability, standard unpkg is safest if local fails,
// but user requested "No CDN" effectively.
// However, getting local worker to work in Vite implies importing it.
// Let's try the modern Vite URL import.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFViewerProps {
    url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        // Reset state on new URL
        setPageNumber(1);
        setError(false);
        setError(false);
    }, [url]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    function onDocumentLoadError() {
        setError(true);
    }

    return (
        <div className="pdf-wrapper h-full flex-col">
            {/* Toolbar */}
            <div className="pdf-toolbar">
                <div className="flex-center gap-2">
                    <button className="glass-btn secondary" style={{ padding: '8px' }} onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: '14px', fontVariant: 'tabular-nums', minWidth: '80px', textAlign: 'center' }}>
                        {pageNumber} / {numPages || '--'}
                    </span>
                    <button className="glass-btn secondary" style={{ padding: '8px' }} onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={pageNumber >= (numPages || 1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="flex-center gap-2">
                    <button className="glass-btn secondary" style={{ padding: '8px' }} onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                        <ZoomOut size={18} />
                    </button>
                    <span style={{ fontSize: '14px', minWidth: '40px', textAlign: 'center', lineHeight: '36px' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button className="glass-btn secondary" style={{ padding: '8px' }} onClick={() => setScale(s => Math.min(2.5, s + 0.1))}>
                        <ZoomIn size={18} />
                    </button>
                </div>

                <div className="flex-center gap-2">
                    <a href={url} download className="glass-btn flex-center gap-2" style={{ padding: '8px 16px', textDecoration: 'none' }}>
                        <Download size={16} /> <span className="text-sm">Download</span>
                    </a>
                </div>
            </div>

            {/* Viewer Area */}
            <div className="pdf-viewport glass-panel"
                ref={(el) => {
                    if (el) setContainerWidth(el.getBoundingClientRect().width);
                }}
            >
                <div className="pdf-scroll-area">
                    {error ? (
                        <div className="flex-center flex-col h-full text-muted">
                            <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>Failed to load document.</p>
                            <a href={url} target="_blank" rel="noreferrer" className="glass-btn secondary flex-center gap-2" style={{ marginTop: '16px', textDecoration: 'none' }}>
                                <ExternalLink size={16} /> Open in New Tab
                            </a>
                        </div>
                    ) : (
                        <Document
                            file={url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex-center flex-col" style={{ paddingTop: '100px' }}>
                                    <RefreshCw className="animate-spin" size={32} color="var(--accent-color)" />
                                    <p className="gap-2" style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Decrypting PDF...</p>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                width={containerWidth ? containerWidth - 40 : undefined}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="shadow-lg"
                            />
                        </Document>
                    )}
                </div>
            </div>
        </div>
    );
}
