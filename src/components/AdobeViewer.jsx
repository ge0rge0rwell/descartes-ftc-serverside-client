import React, { useEffect, useRef, useState } from 'react';

const ADOBE_SDK_SRC = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';

const AdobeViewer = ({ pdfUrl, pageNum }) => {
    const adobeApiRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    // Initialise the Adobe viewer once per pdfUrl.
    useEffect(() => {
        let cancelled = false;

        const initViewer = () => {
            if (cancelled || !window.AdobeDC) return;

            const adobeDCView = new window.AdobeDC.View({
                clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
                divId: 'adobe-dc-view',
            });

            adobeDCView
                .previewFile(
                    {
                        content: { location: { url: pdfUrl } },
                        metaData: { fileName: 'game-manual.pdf' },
                    },
                    {
                        embedMode: 'FULL_WINDOW',
                        showAnnotationTools: false,
                        showLeftHandPanel: true,
                    },
                )
                .then((viewer) => {
                    if (cancelled) return;
                    adobeApiRef.current = viewer;
                    setIsReady(true);
                });
        };

        if (window.AdobeDC) {
            initViewer();
        } else {
            if (!document.querySelector(`script[src="${ADOBE_SDK_SRC}"]`)) {
                const script = document.createElement('script');
                script.src = ADOBE_SDK_SRC;
                script.async = true;
                document.body.appendChild(script);
            }
            document.addEventListener('adobe_dc_view_sdk.ready', initViewer);
        }

        return () => {
            cancelled = true;
            document.removeEventListener('adobe_dc_view_sdk.ready', initViewer);
            // Tear down before the next pdfUrl mounts a fresh viewer: clear the
            // stale ready flag, drop the API ref, and empty the container so an
            // old document (or a stuck "Loading manual…") can never persist.
            setIsReady(false);
            adobeApiRef.current = null;
            const container = document.getElementById('adobe-dc-view');
            if (container) container.replaceChildren();
        };
    }, [pdfUrl]);

    // Navigate to the requested page once the viewer is ready.
    useEffect(() => {
        if (isReady && adobeApiRef.current && pageNum) {
            adobeApiRef.current
                .getAPIs()
                .then((apis) => apis.gotoLocation(pageNum))
                .catch(() => {});
        }
    }, [pageNum, isReady]);

    return (
        <div className="pdf-viewer-root">
            {!isReady && (
                <div className="pdf-loading">
                    <span className="pdf-loading-spinner" aria-hidden="true" />
                    <span className="pdf-loading-text">Loading manual…</span>
                </div>
            )}
            <div id="adobe-dc-view" className="adobe-dc-view" />
        </div>
    );
};

export default AdobeViewer;
