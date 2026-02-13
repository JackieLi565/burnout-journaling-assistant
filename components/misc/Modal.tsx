// components/Modal.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    // Use a ref to ensure we don't try to access document during SSR
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Close the modal if the user presses the Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Don't render anything if the modal is closed
    if (!isOpen) return null;

    // Render the modal into the document.body via Portal
    return createPortal(
        <div
            style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}
    onClick={onClose} // Close when clicking the overlay
    >
    <div
        style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px' }}
    onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
>
    <button onClick={onClose} style={{ float: 'right' }}>X</button>
    {children}
    </div>
    </div>,
    document.body
);
}