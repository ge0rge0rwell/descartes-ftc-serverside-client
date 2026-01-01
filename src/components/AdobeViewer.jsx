import React, { useEffect, useRef } from 'react';

const AdobeViewer = ({ pdfUrl, clientId, pageNum }) => {
    const viewerRef = useRef(null);
    const adobeApiRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
        script.async = true;
        document.body.appendChild(script);

        document.addEventListener('adobe_dc_view_sdk.ready', () => {
            const adobeDCView = new window.AdobeDC.View({
                clientId: clientId || 'fffe28c6207c426982ef2e19631ab6b2', // User provided localhost ID
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
        });

        return () => {
            document.body.removeChild(script);
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
        <div
            id="adobe-dc-view"
            ref={viewerRef}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default AdobeViewer;
