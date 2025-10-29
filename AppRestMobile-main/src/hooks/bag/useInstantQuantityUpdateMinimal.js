// src/hooks/bag/useInstantQuantityUpdateMinimal.js
import { useState } from 'react';

/**
 * 🚀 Hook mínimo para debug
 */
export const useInstantQuantityUpdateMinimal = () => {
  const [localQuantities] = useState({});

  console.log('🔧 [useInstantQuantityUpdateMinimal] Inicializado con localQuantities:', localQuantities);

  const updateQuantity = () => {
    console.log('🔧 [useInstantQuantityUpdateMinimal] updateQuantity called');
  };

  const getQuantity = (product) => {
    return product?.quantity || 0;
  };

  const result = {
    updateQuantity,
    getQuantity,
    localQuantities: localQuantities || {},
    hasPendingUpdates: false
  };

  console.log('🔧 [useInstantQuantityUpdateMinimal] Returning result:', result);

  return result;
};

export default useInstantQuantityUpdateMinimal;