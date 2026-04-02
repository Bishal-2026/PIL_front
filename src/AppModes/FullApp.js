import React from 'react';
import WebView from './WebView';

const FullApp = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden bg-white">
            <WebView url="https://pidiliteapp.ajivainfotech.com" allowPermission="camera; microphone; geolocation" />
        </div>
    );
};

export default FullApp;
