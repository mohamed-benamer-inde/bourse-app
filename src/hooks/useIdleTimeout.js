import { useState, useEffect, useRef } from 'react';

const useIdleTimeout = (onIdle, idleTime = 15 * 60 * 1000) => {
    const [isIdle, setIsIdle] = useState(false);
    const timeoutId = useRef(null);

    const handleTimeout = () => {
        setIsIdle(true);
        if (onIdle) onIdle();
    };

    const resetTimeout = () => {
        setIsIdle(false);
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(handleTimeout, idleTime);
    };

    useEffect(() => {
        // Events to listen for activity
        const events = [
            'load',
            'mousemove',
            'mousedown',
            'click',
            'scroll',
            'keypress'
        ];

        // Attach event listeners
        events.forEach((event) => {
            window.addEventListener(event, resetTimeout);
        });

        // Initialize timeout
        resetTimeout();

        // Cleanup
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, resetTimeout);
            });
        };
    }, [idleTime, onIdle]);

    return isIdle;
};

export default useIdleTimeout;
