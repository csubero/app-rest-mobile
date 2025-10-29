import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useTheme} from '../../../providers/ThemeProvider';
import {useTranslation} from 'react-i18next';

const SplitPaymentDisclaimer = () => {
  const {colors, font_type, sizes} = useTheme();
  const {t} = useTranslation();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.warning || '#FFF3CD',
      padding: 15,
      marginVertical: 10,
      borderRadius: sizes.borderRadius2,
      borderLeftWidth: 4,
      borderLeftColor: colors.button || '#c63663',
      //   maxHeight: 300,
      width: '70%',
      justifyContent: 'center',
      alignItems: 'center',
      justifySelf: 'center',
    },
    title: {
      fontSize: 16,
      fontFamily: font_type.semibold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    text: {
      fontSize: 14,
      fontFamily: font_type.regular,
      color: colors.text,
      lineHeight: 20,
      textAlign: 'justify',
    },
    scrollContainer: {
      flex: 1,
      width: '100%',
      maxHeight: 60,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('split_payment_disclaimer_title') ||
          'Información Importante - Pago Dividido'}
      </Text>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}>
        <Text style={styles.text}>
          {t('split_payment_disclaimer_text') ||
            'Al dividir el pago en partes iguales: 1) No se podrá redimir puntos Lineup en pagos parciales. 2) Solo cuando se paguen TODOS los splits restantes se podrá acumular puntos Lineup. 3) Los puntos se calcularán sobre el total de la orden completa. 4) Todos los productos de la orden se incluirán en la factura del pago final para efectos de acumulación.'}
        </Text>
      </ScrollView>
    </View>
  );
};

export default SplitPaymentDisclaimer;
