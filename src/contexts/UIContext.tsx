import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, GameItem } from '../types';

export type ModalType = 
  | 'poolDetail'
  | 'instantBuy'
  | 'vault'
  | 'createPool'
  | 'wallet'
  | 'depositHub'
  | 'escrowGuide'
  | 'topup'
  | 'tickets'
  | 'sellerSupplier'
  | 'admin'
  | 'telcoCard'
  | 'luckyWheel'
  | 'orderLookup'
  | 'affiliate'
  | 'txLedger'
  | 'keyTools'
  | 'aiConfig'
  | 'homeAnnouncement'
  | 'fanMenu'
  | null;

export interface ModalPayload {
  selectedProduct?: Product | null;
  selectedGame?: GameItem | null;
  initialDepositAmount?: number;
  initialDepositMethod?: 'bank_vietqr' | 'telco_card' | 'momo' | 'crypto_usdt' | 'binance_pay' | 'binance_pay_v2';
  [key: string]: any;
}

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface UIContextType {
  activeModal: ModalType;
  modalPayload: ModalPayload;
  openModal: (modal: ModalType, payload?: ModalPayload) => void;
  closeModal: () => void;
  isModalOpen: (modal: ModalType) => boolean;
  toasts: ToastInfo[];
  showToast: (message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload>({});
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const openModal = (modal: ModalType, payload: ModalPayload = {}) => {
    setActiveModal(modal);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload({});
  };

  const isModalOpen = (modal: ModalType) => activeModal === modal;

  const showToast = (message: string, type: ToastInfo['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <UIContext.Provider
      value={{
        activeModal,
        modalPayload,
        openModal,
        closeModal,
        isModalOpen,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
