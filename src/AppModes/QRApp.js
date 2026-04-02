import React from 'react';
import WebView from './WebView';

const QRApp = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden bg-white font-sans">
            <WebView url="/qr?mode=app" allowPermission="camera" />
        </div>
    );
};

export default QRApp;
