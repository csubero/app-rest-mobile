import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {useSmartImageCache} from '../../hooks/general/useSmartImageCache';
import {useTheme} from '../../providers/ThemeProvider';

/**
 * Componente de gestión de caché de imágenes (útil para debug y configuración)
 */
const ImageCacheManager = ({visible = false}) => {
  const [stats, setStats] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {getCacheStats, clearCache} = useSmartImageCache();
  const {colors, dimensions, font_type} = useTheme();

  // Actualizar estadísticas
  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newStats = getCacheStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error obteniendo estadísticas del caché:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [getCacheStats]);

  // Actualizar estadísticas automáticamente
  useEffect(() => {
    if (visible) {
      refreshStats();
      const interval = setInterval(refreshStats, 5000); // Actualizar cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [visible, refreshStats]);

  // Limpiar caché con confirmación
  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que quieres limpiar todo el caché de imágenes? Esto puede afectar la velocidad de carga temporalmente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Éxito', 'Caché limpiado correctamente');
              refreshStats();
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar el caché');
            }
          },
        },
      ],
    );
  }, [clearCache, refreshStats]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.bold,
      color: colors.primary,
      marginBottom: 15,
      textAlign: 'center',
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#e0e0e0',
    },
    statLabel: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: colors.text,
      flex: 1,
    },
    statValue: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.bold,
      color: colors.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: dimensions.width * 0.2,
    },
    buttonSecondary: {
      backgroundColor: colors.secondary || '#666',
    },
    buttonText: {
      color: colors.white || '#fff',
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.bold,
      textAlign: 'center',
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginLeft: 8,
    },
    statusActive: {
      backgroundColor: '#4CAF50',
    },
    statusInactive: {
      backgroundColor: '#f44336',
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Caché de Imágenes</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Entradas en Memoria</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.statValue}>{stats.memoryEntries || 0}</Text>
            <View style={[
              styles.statusIndicator,
              (stats.memoryEntries || 0) > 0 ? styles.statusActive : styles.statusInactive
            ]} />
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Metadatos Guardados</Text>
          <Text style={styles.statValue}>{stats.metadataEntries || 0}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Cola de Precarga</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.statValue}>{stats.queueLength || 0}</Text>
            <View style={[
              styles.statusIndicator,
              stats.isPreloading ? styles.statusActive : styles.statusInactive
            ]} />
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Estado de Precarga</Text>
          <Text style={styles.statValue}>
            {stats.isPreloading ? 'Activa' : 'Inactiva'}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Versión del Caché</Text>
          <Text style={styles.statValue}>{stats.version || 'N/A'}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={refreshStats}
          disabled={isRefreshing}
        >
          <Text style={styles.buttonText}>
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClearCache}
          disabled={isRefreshing}
        >
          <Text style={styles.buttonText}>Limpiar Caché</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ImageCacheManager;