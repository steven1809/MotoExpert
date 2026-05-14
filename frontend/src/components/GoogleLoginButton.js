import React, { useEffect, useRef } from 'react';

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && buttonRef.current) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
            callback: (response) => {
              if (response.credential) {
                onSuccess(response.credential);
              } else {
                onError && onError('No credential received');
              }
            },
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'center',
          });
        }
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      className="w-full"
    />
  );
};

export default GoogleLoginButton;
