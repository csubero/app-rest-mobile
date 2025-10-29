// src/components/bag/OptimizedQuantityDisplay.jsx
import React from 'react';
import { Text } from 'react-native';

/**
 * 🚀 Componente ultra-optimizado para mostrar cantidades
 * Evita re-renders innecesarios cuando solo cambia la cantidad
 */
const OptimizedQuantityDisplay = React.memo(({ 
  quantity, 
  style 
}) => {
  return (
    <Text style={style}>
      {quantity}
    </Text>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si la cantidad cambia
  return prevProps.quantity === nextProps.quantity;
});

export default OptimizedQuantityDisplay;