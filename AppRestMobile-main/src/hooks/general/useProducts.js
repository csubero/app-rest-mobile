/**
 * 🚀 OPTIMIZADO: Custom Hook para usar ProductService con suscripciones reactivas
 * Elimina estado local redundante y usa el sistema de listeners del ProductService
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProductService from '../../services/api/ProductService';

/**
 * Hook principal para gestionar productos con suscripciones reactivas
 * @param {Object} options - Opciones de configuración
 * @param {string} options.language - Idioma por defecto ('es' o 'en')
 * @returns {Object} Métodos y estados de productos
 */
export const useProducts = (options = {}) => {
  const { language = 'es' } = options;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚀 OPTIMIZACIÓN: Suscripción reactiva al ProductService
  useEffect(() => {
    console.log('🔌 [useProducts] Suscribiéndose a ProductService...');
    
    // Suscribirse a cambios en productos
    const unsubscribe = ProductService.subscribe((newProducts) => {
      console.log('🔄 [useProducts] Productos actualizados:', newProducts.length);
      setProducts(newProducts);
      setError(null);
    });
    
    // Obtener datos iniciales si ya existen
    const initialProducts = ProductService.getProducts();
    if (initialProducts.length > 0) {
      console.log('📦 [useProducts] Datos iniciales:', initialProducts.length);
      setProducts(initialProducts);
    }
    
    // Cleanup: desuscribirse al desmontar
    return () => {
      console.log('🔌 [useProducts] Desuscribiéndose...');
      unsubscribe();
    };
  }, []);

  /**
   * 🚀 OPTIMIZACIÓN: Sincroniza productos desde el API (sin cambiar estado local)
   */
  const refreshProducts = useCallback(async () => {
    // Verificar configuración antes de hacer fetch
    if (!ProductService.serverIp || !ProductService.apiToken) {
      const errorMsg = 'ProductService no está configurado. Llama a configure() primero.';
      console.error('❌', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 🚀 ProductService se encargará de notificar via listeners
      await ProductService.fetchProducts();
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🚀 OPTIMIZACIÓN: Busca productos por término (retorna directamente sin cambiar estado)
   */
  const searchProducts = useCallback((term, lang = language) => {
    try {
      return ProductService.searchProducts(term, lang);
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err.message);
      return [];
    }
  }, [language]);

  /**
   * 🚀 OPTIMIZACIÓN: Filtra productos por sección/categoría (retorna directamente)
   */
  const filterByCategory = useCallback((categoryId) => {
    try {
      return ProductService.getProductsBySection(categoryId);
    } catch (err) {
      console.error('Error filtering by category:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * 🚀 OPTIMIZACIÓN: Filtra productos por familia (retorna directamente)
   */
  const filterByFamily = useCallback((familyId) => {
    try {
      return ProductService.getProductsByFamily(familyId);
    } catch (err) {
      console.error('Error filtering by family:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * 🚀 OPTIMIZACIÓN: Filtra productos por rango de precio (retorna directamente)
   */
  const filterByPriceRange = useCallback((minPrice, maxPrice) => {
    try {
      return ProductService.getProductsByPriceRange(minPrice, maxPrice);
    } catch (err) {
      console.error('Error filtering by price:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Obtiene un producto por ID
   */
  const getProductById = useCallback((productId) => {
    try {
      return ProductService.getProductById(productId);
    } catch (err) {
      console.error('Error getting product by ID:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * 🚀 OPTIMIZACIÓN: Obtiene productos con descuento (retorna directamente)
   */
  const getDiscountedProducts = useCallback(() => {
    try {
      return ProductService.getDiscountedProducts();
    } catch (err) {
      console.error('Error getting discounted products:', err);
      setError(err.message);
      return [];
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Valores memorizados basados en ProductService directo
  const menus = useMemo(() => ProductService.getMenus(), [products]);
  const families = useMemo(() => ProductService.getFamilies(), [products]);
  const stats = useMemo(() => ProductService.getProductsStats(), [products]);
  const hasProducts = useMemo(() => ProductService.hasProducts(), [products]);

  return {
    // Estado reactivo via suscripciones
    products,
    loading,
    error,
    hasProducts,
    
    // Datos relacionados (actualizados automáticamente)
    menus,
    families,
    stats,
    
    // Métodos de carga
    refreshProducts,
    
    // Métodos de búsqueda y filtrado (sin efectos secundarios)
    searchProducts,
    filterByCategory,
    filterByFamily,
    filterByPriceRange,
    
    // Métodos de consulta directa
    getProductById,
    getDiscountedProducts,
    
    // Servicio directo para métodos avanzados
    service: ProductService,
  };
};

/**
 * Hook específico para obtener un producto por ID
 * @param {number|string} productId - ID del producto
 * @param {string} language - Idioma ('es' o 'en')
 */
export const useProduct = (productId, language = 'es') => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      const foundProduct = ProductService.getProductById(productId);
      setProduct(foundProduct);
      setLoading(false);
    }
  }, [productId]);

  const name = useMemo(() => 
    product ? (language === 'es' ? product.name_es : product.name_en) : '',
    [product, language]
  );

  const description = useMemo(() => 
    product ? (language === 'es' ? product.description_es : product.description_en) : '',
    [product, language]
  );

  const hasDiscount = useMemo(() => 
    product ? product.price < product.full_price : false,
    [product]
  );

  const discountPercentage = useMemo(() => 
    product ? ProductService.getProductDiscountPercentage(productId) : 0,
    [product, productId]
  );

  const recommended = useMemo(() => 
    productId ? ProductService.getRecommendedProducts(productId) : [],
    [productId]
  );

  return {
    product,
    loading,
    name,
    description,
    hasDiscount,
    discountPercentage,
    recommended,
  };
};

/**
 * 🚀 OPTIMIZADO: Hook para obtener categorías/menús con suscripciones
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);

  // Suscripción reactiva para categorías
  useEffect(() => {
    const unsubscribe = ProductService.subscribe(() => {
      const newCategories = ProductService.getMenus();
      setCategories(newCategories);
    });
    
    // Datos iniciales
    const initialCategories = ProductService.getMenus();
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    }
    
    return unsubscribe;
  }, []);

  const getCategoryProductCount = useCallback((categoryId) => {
    return ProductService.getProductsBySection(categoryId).length;
  }, []);

  return {
    categories,
    getCategoryProductCount,
  };
};

/**
 * Hook para búsqueda en tiempo real
 * @param {string} initialTerm - Término inicial de búsqueda
 * @param {string} language - Idioma de búsqueda
 */
export const useProductSearch = (initialTerm = '', language = 'es') => {
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
    } else {
      const searchResults = ProductService.searchProducts(searchTerm, language);
      setResults(searchResults);
    }
  }, [searchTerm, language]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    clearSearch,
    resultsCount: results.length,
  };
};

/**
 * Hook para estadísticas de productos
 */
export const useProductStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (ProductService.hasProducts()) {
      setStats(ProductService.getProductsStats());
    }
  }, []);

  const refresh = useCallback(() => {
    setStats(ProductService.getProductsStats());
  }, []);

  return {
    stats,
    refresh,
  };
};

/**
 * Hook para productos con descuento
 */
export const useDiscountedProducts = () => {
  const [discounted, setDiscounted] = useState([]);

  useEffect(() => {
    if (ProductService.hasProducts()) {
      const products = ProductService.getDiscountedProducts();
      
      // Agregar porcentaje de descuento a cada producto
      const withPercentage = products.map(product => ({
        ...product,
        discountPercent: ProductService.getProductDiscountPercentage(product.id),
      }));
      
      // Ordenar por mayor descuento
      const sorted = withPercentage.sort((a, b) => 
        b.discountPercent - a.discountPercent
      );
      
      setDiscounted(sorted);
    }
  }, []);

  return {
    discounted,
    count: discounted.length,
  };
};

export default useProducts;
