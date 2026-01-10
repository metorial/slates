import { type ReactNode } from 'react';
import { Button, Dialog } from '@metorial-io/ui';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
};

export let ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
  loading = false
}: ConfirmDialogProps) => {
  return (
    <Dialog.Wrapper isOpen={open} onOpenChange={onOpenChange}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <Dialog.Actions>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="solid"
          color={destructive ? 'red' : undefined}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog.Wrapper>
  );
};
