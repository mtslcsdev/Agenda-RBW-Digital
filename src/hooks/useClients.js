import { useApp } from '../context/AppContext'

// Hook de conveniência para operações de clientes
export function useClients() {
  const { clients, allClients, hiddenClients, archivedClients, addClient, editClient, archiveClient, toggleClientHidden } = useApp()

  return {
    clients,
    allClients,
    hiddenClients,
    archivedClients,
    addClient,
    editClient,
    archiveClient,
    toggleClientHidden,
  }
}
