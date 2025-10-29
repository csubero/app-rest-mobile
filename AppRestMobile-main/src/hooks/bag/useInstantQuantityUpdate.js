// src/hooks/bag/useInstantQuantityUpdate.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateProductByIndex } from '../../redux/slice/bagSlice';
import Utils from '../../helpers/utils/Utils';

/**
 * 🚀 Hook optimizado para actualizaciones instantáneas de cantidad
 * Proporciona actualización inmediata en UI con debounce en Redux
 */
export const useInstantQuantityUpdate = (debounceMs = 300) => {
  const dispatch = useDispatch();
  const [localQuantities, setLocalQuantities] = useState({});
  const timeoutsRef = useRef({});

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current = {};
    };
  }, []);

  // Función para actualizar cantidad con optimización inmediata
  const updateQuantity = useCallback((index, product, newQuantity, isBlocked = false) => {
    if (isBlocked || product.quantity === newQuantity) {
      return;
    }

    const productId = product.internalId;

    // Actualizar UI inmediatamente
    setLocalQuantities(prev => {
      const updated = {
        ...prev,
        [productId]: newQuantity
      };
      console.log('🔄 [useInstantQuantityUpdate] Estado local actualizado:', {
        productId,
        newQuantity,
        localQuantities: updated
      });
      return updated;
    });

    // Limpiar timeout anterior si existe
    if (timeoutsRef.current[productId]) {
      clearTimeout(timeoutsRef.current[productId]);
    }

    // Debounce para Redux
    timeoutsRef.current[productId] = setTimeout(() => {
      const updatedProduct = { ...product, quantity: newQuantity };
      const dataProduct = Utils.calculateProductTotal(index, updatedProduct, newQuantity);

      // Actualizar Redux
      dispatch(updateProductByIndex({ index, product: dataProduct.product }));
      
      // Limpiar estado local
      setLocalQuantities(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      // Limpiar referencia del timeout
      delete timeoutsRef.current[productId];
    }, debounceMs);
  }, [dispatch, debounceMs]);

  // Función para obtener la cantidad actual (local o de Redux)
  const getQuantity = useCallback((product) => {
    return localQuantities[product.internalId] ?? product.quantity;
  }, [localQuantities]);

  // Función para calcular el totalLine de un producto específico
  const calculateProductTotalLine = useCallback((product, quantity = null) => {
    const currentQuantity = quantity ?? (localQuantities[product.internalId] ?? product.quantity);
    
    const basePrice = product.price || 0;
    let modifiersTotal = 0;
    
    if (product.customizations && Array.isArray(product.customizations)) {
      product.customizations.forEach(modifier => {
        modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
      });
    }
    
    const subtotalBeforeTax = (basePrice + modifiersTotal) * currentQuantity;
    const taxRate = product.taxRate || 0;
    const taxes = subtotalBeforeTax * (taxRate / 100);
    return subtotalBeforeTax + taxes;
  }, [localQuantities]);

  // Función para calcular el total temporal con cantidades locales
  const calculateTempTotal = useCallback((products) => {
    return products.reduce((total, product) => {
      const productTotal = calculateProductTotalLine(product);
      return total + productTotal;
    }, 0);
  }, [calculateProductTotalLine]);

  // Función para limpiar actualizaciones pendientes de un producto específico
  const clearPendingUpdate = useCallback((productId) => {
    if (timeoutsRef.current[productId]) {
      clearTimeout(timeoutsRef.current[productId]);
      delete timeoutsRef.current[productId];
    }
    
    setLocalQuantities(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  }, []);

  return {
    updateQuantity,
    getQuantity,
    calculateTempTotal,
    calculateProductTotalLine,
    clearPendingUpdate,
    localQuantities: localQuantities || {},
    hasPendingUpdates: localQuantities ? Object.keys(localQuantities).length > 0 : false
  };
};

export default useInstantQuantityUpdate;