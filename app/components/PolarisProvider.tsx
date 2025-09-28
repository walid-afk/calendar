'use client'

import { AppProvider } from '@shopify/polaris'

interface PolarisProviderProps {
  children: React.ReactNode
}

export function PolarisProvider({ children }: PolarisProviderProps) {
  return (
    <AppProvider i18n={{
      Polaris: {
        Common: {
          checkbox: 'Case à cocher',
          undo: 'Annuler',
          cancel: 'Annuler',
          clear: 'Effacer',
          submit: 'Soumettre',
          more: 'Plus',
          loading: 'Chargement',
          optional: 'Optionnel',
          required: 'Requis',
          search: 'Rechercher',
          filter: 'Filtrer',
          refresh: 'Actualiser',
          previous: 'Précédent',
          next: 'Suivant',
          close: 'Fermer',
          save: 'Enregistrer',
          edit: 'Modifier',
          delete: 'Supprimer',
          add: 'Ajouter',
        }
      }
    }}>
      {children}
    </AppProvider>
  )
}
