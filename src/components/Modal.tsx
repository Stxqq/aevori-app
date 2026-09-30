import * as Dialog from '@radix-ui/react-dialog';
import type React from 'react';
import { X } from '../MotionIcon';
import SmoothHeight from './SmoothHeight';

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${className}`}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description className={description ? 'dialog-description' : 'sr-only'}>
            {description || title}
          </Dialog.Description>
          <Dialog.Close className="icon-button close" aria-label="Close">
            <X size={19} />
          </Dialog.Close>
          <SmoothHeight>{children}</SmoothHeight>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
