'use client'

import { Modal, Button, Text } from '@shopify/polaris'

interface ConfirmOpenExternalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export function ConfirmOpenExternalModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Ouvrir Google Calendar',
  message = 'Voulez-vous ouvrir Google Calendar dans une nouvelle fenêtre ?'
}: ConfirmOpenExternalModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      primaryAction={{
        content: 'Ouvrir',
        onAction: () => {
          onConfirm()
          onClose()
        }
      }}
      secondaryActions={[
        {
          content: 'Annuler',
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        <Text variant="bodyMd" as="p">
          {message}
        </Text>
      </Modal.Section>
    </Modal>
  )
}
