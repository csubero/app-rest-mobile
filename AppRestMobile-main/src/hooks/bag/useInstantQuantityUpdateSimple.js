// src/hooks/bag/useInstantQuantityUpdateSimple.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateProductByIndex } from '../../redux/slice/bagSlice';
import Utils from '../../helpers/utils/Utils';

/**
 * 🚀 Hook simplificado para debugging
 */
export const useInstantQuantityUpdateSimple = (debounceMs = 300, onQuantityChange = null) => {
  const dispatch = useDispatch();
  const [localQuantitiesState, setLocalQuantitiesState] = useState({});
  const timeoutsRef = useRef({});

  // Asegurar que localQuantities nunca sea undefined
  const localQuantities = localQuantitiesState || {};

  // console.log('🔧 [useInstantQuantityUpdateSimple] Hook initialized, localQuantities:', localQuantities, 'state:', localQuantitiesState);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutsRef.current) {
        Object.values(timeoutsRef.current).forEach(timeoutId => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        });
        timeoutsRef.current = {};
      }
    };
  }, []);

  // Función para actualizar cantidad con optimización inmediata
  const updateQuantity = useCallback((index, product, newQuantity, isBlocked = false) => {
    console.log('🔧 [useInstantQuantityUpdateSimple] updateQuantity called:', {
      index, 
      productId: product?.internalId, 
      sku: product?.sku,
      currentQuantity: product?.quantity,
      newQuantity,
      isBlocked
    });

    if (isBlocked || !product || product.quantity === newQuantity) {
      console.log('⏭️ [useInstantQuantityUpdateSimple] Skipping update:', {
        isBlocked,
        noProduct: !product,
        sameQuantity: product?.quantity === newQuantity
      });
      return;
    }

    const productId = product.internalId;
    if (!productId) {
      console.warn('⚠️ [useInstantQuantityUpdateSimple] Product missing internalId');
      return;
    }

    try {
      // Actualizar UI inmediatamente
      setLocalQuantitiesState(prev => {
        const updated = {
          ...(prev || {}),
          [productId]: newQuantity
        };
        console.log('✅ [useInstantQuantityUpdateSimple] Estado local actualizado:', {
          productId,
          newQuantity,
          updatedState: updated
        });
        
        // Notificar cambio inmediatamente para actualización de totales
        if (onQuantityChange) {
          onQuantityChange(productId, newQuantity, product);
        }
        
        return updated;
      });

      // Limpiar timeout anterior si existe
      if (timeoutsRef.current && timeoutsRef.current[productId]) {
        clearTimeout(timeoutsRef.current[productId]);
      }

      // Debounce para Redux
      if (!timeoutsRef.current) {
        timeoutsRef.current = {};
      }

      timeoutsRef.current[productId] = setTimeout(() => {
        try {
          const updatedProduct = { ...product, quantity: newQuantity };
          const dataProduct = Utils.calculateProductTotal(index, updatedProduct, newQuantity);

          // Actualizar Redux
          dispatch(updateProductByIndex({ index, product: dataProduct.product }));
          
          // Limpiar estado local
          setLocalQuantitiesState(prev => {
            const newState = { ...(prev || {}) };
            delete newState[productId];
            return newState;
          });
          
          // Limpiar referencia del timeout
          if (timeoutsRef.current) {
            delete timeoutsRef.current[productId];
          }
        } catch (error) {
          console.error('❌ [useInstantQuantityUpdateSimple] Error in timeout:', error);
        }
      }, debounceMs);
    } catch (error) {
      console.error('❌ [useInstantQuantityUpdateSimple] Error in updateQuantity:', error);
    }
  }, [dispatch, debounceMs]);

  // Función para obtener la cantidad actual (local o de Redux)
  const getQuantity = useCallback((product) => {
    if (!product || !product.internalId) return product?.quantity || 0;
    const localQty = localQuantities ? localQuantities[product.internalId] : undefined;
    return localQty ?? product.quantity;
  }, [localQuantities]);

  const returnValue = {
    updateQuantity,
    getQuantity,
    localQuantities: localQuantities || {},
    hasPendingUpdates: localQuantities ? Object.keys(localQuantities).length > 0 : false
  };

  // console.log('🔧 [useInstantQuantityUpdateSimple] Returning:', returnValue);

  return returnValue;
};

export default useInstantQuantityUpdateSimple;