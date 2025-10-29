import React, {useState, useRef, useCallback, useEffect, useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';
import ProductListComponent from '../../components/products/ProductListComponent';
import Icon from 'react-native-vector-icons/FontAwesome6';

const ProductsListView = ({sectionId, onBack, navigation}) => {
  const {colors} = useTheme();
  
  const [selectedItem, setSelectedItem] = useState(sectionId);
  const scrollToSectionRef = useRef(null);

  // Actualizar selectedItem cuando cambia el sectionId
  useEffect(() => {
    if (sectionId) {
      setSelectedItem(sectionId);
    }
  }, [sectionId]);

  const handleScrollToSection = useCallback(scrollFn => {
    scrollToSectionRef.current = scrollFn;
  }, []);

  const triggerScrollToSection = useCallback(
    sectionId => {
      console.log('🎯 [ProductsListView] triggerScrollToSection:', sectionId);
      if (scrollToSectionRef.current) {
        scrollToSectionRef.current(sectionId);
      }
    },
    [],
  );

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  return (
    <View style={styles.container}>
      {/* Botón de regresar - solo mostrar si viene de navigation (no de IndexView) */}
      {!onBack && navigation && (
        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: colors.background}]}
          onPress={handleBack}
          activeOpacity={0.7}>
          <Icon name="chevron-left" size={24} color={colors.primary} solid />
        </TouchableOpacity>
      )}

      <ProductListComponent
        selectedItem={selectedItem}
        navigation={navigation}
        setSelectedItem={setSelectedItem}
        isBagBlocked={false}
        onScrollToSection={handleScrollToSection}
        triggerScrollToSection={triggerScrollToSection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

// 🚀 OPTIMIZACIÓN CRÍTICA: Memoizar ProductsListView
export default React.memo(ProductsListView, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia el sectionId
  const changed = prevProps.sectionId !== nextProps.sectionId;
  
  if (changed) {
    console.log(`[ProductsListView.memo] ❌ Re-rendering - sectionId cambió: ${prevProps.sectionId} -> ${nextProps.sectionId}`);
  } else {
    console.log(`[ProductsListView.memo] ✅ Skip render - sectionId no cambió (${nextProps.sectionId})`);
  }
  
  return !changed; // true = skip render, false = re-render
});
