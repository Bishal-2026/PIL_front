import React from 'react';

const WebView = ({ url, allowPermission = "camera; microphone; geolocation" }) => {
    return (
        <iframe
            src={url}
            title="Web View"
            className="w-full h-full border-none"
            style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                margin: 0,
                padding: 0
            }}
            allow={allowPermission}
        />
    );
};

export default WebView;
