// src/hooks/bag/useOptimizedProducts.js
import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { selectProductsWithMetadata } from '../../redux/slice/bagSlice';

/**
 * 🚀 Hook optimizado para el manejo eficiente de productos en el bag
 * Evita re-renders innecesarios y optimiza cálculos costosos
 */
export const useOptimizedProducts = () => {
  // Usar el nuevo selector optimizado que incluye metadatos
  const productData = useSelector(selectProductsWithMetadata, shallowEqual);

  // Extraer datos del selector optimizado
  const {
    products,
    count,
    hasProducts,
    isEmpty,
    productsByInternalId,
    skus
  } = productData;

  // Retornar con la misma interfaz para compatibilidad
  const productStats = useMemo(() => ({
    count,
    hasProducts,
    isEmpty,
  }), [count, hasProducts, isEmpty]);

  const productSkus = useMemo(() => skus, [skus]);
  const productsById = useMemo(() => productsByInternalId, [productsByInternalId]);

  return {
    products,
    productStats,
    productSkus,
    productsById,
  };
};

/**
 * 🚀 Hook para cálculos optimizados de recomendaciones
 */
export const useOptimizedRecommendations = (products, isInitialized) => {
  return useMemo(() => {
    if (!isInitialized || products.length === 0) {
      return [];
    }

    const productSkusInBag = new Set();
    const allRecommendations = [];
    
    // Una sola iteración para recopilar SKUs y recomendaciones
    products.forEach(item => {
      productSkusInBag.add(item.sku);
      
      if (item.recommended_products?.length > 0) {
        allRecommendations.push(...item.recommended_products);
      }
    });

    if (allRecommendations.length === 0) {
      return [];
    }

    // Conteo eficiente con Map
    const recommendationCounts = new Map();

    allRecommendations.forEach(item => {
      if (!productSkusInBag.has(item.sku)) {
        const current = recommendationCounts.get(item.sku);
        recommendationCounts.set(item.sku, {
          item,
          count: current ? current.count + 1 : 1
        });
      }
    });

    // Ordenar y limitar eficientemente, luego obtener productos completos
    const ProductService = require('../../services/api/ProductService').default;
    
    return Array.from(recommendationCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(entry => {
        // 🚀 OPTIMIZACIÓN: Obtener producto completo desde ProductService
        const fullProduct = ProductService.getProductBySku(entry.item.sku);
        // Si no se encuentra el producto completo, usar el limitado como fallback
        return fullProduct || entry.item;
      })
      .filter(product => product !== null); // Eliminar productos null
  }, [products, isInitialized]);
};