import React, { useEffect, useRef } from 'react';

const AdobeViewer = ({ pdfUrl, clientId, pageNum }) => {
    const viewerRef = useRef(null);
    const adobeApiRef = useRef(null);

    useEffect(() => {
        const initViewer = () => {
            const adobeDCView = new window.AdobeDC.View({
                clientId: clientId || 'fffe28c6207c426982ef2e19631ab6b2',
                divId: 'adobe-dc-view',
            });

            adobeDCView.previewFile({
                content: { location: { url: pdfUrl } },
                metaData: { fileName: 'game-manual.pdf' }
            }, {
                embedMode: 'FULL_WINDOW',
                showAnnotationTools: false,
                showLeftHandPanel: true,
            }).then(viewer => {
                adobeApiRef.current = viewer;
                if (pageNum) {
                    viewer.getAPIs().then(apis => {
                        apis.gotoLocation(pageNum);
                    });
                }
            });
        };

        if (window.AdobeDC) {
            initViewer();
        } else {
            const script = document.createElement('script');
            script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
            script.async = true;
            script.onload = () => {
                if (window.AdobeDC) initViewer();
            };
            document.body.appendChild(script);

            document.addEventListener('adobe_dc_view_sdk.ready', initViewer);
        }

        return () => {
            document.removeEventListener('adobe_dc_view_sdk.ready', initViewer);
        };
    }, [pdfUrl, clientId]);

    useEffect(() => {
        if (adobeApiRef.current && pageNum) {
            adobeApiRef.current.getAPIs().then(apis => {
                apis.gotoLocation(pageNum);
            });
        }
    }, [pageNum]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {!adobeApiRef.current && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'var(--text-secondary)',
                    zIndex: 0
                }}>
                    Klavuz Yükleniyor...
                </div>
            )}
            <div
                id="adobe-dc-view"
                ref={viewerRef}
                style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
            />
        </div>
    );
};

export default AdobeViewer;
