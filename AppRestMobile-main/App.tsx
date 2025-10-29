/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {store} from './src/redux/store';
import {NavigationContainer} from '@react-navigation/native';
import {Platform, StatusBar, View, StyleSheet} from 'react-native';
import NavigationComponent from './src/navigation/NavigationComponent';
import {I18nextProvider} from 'react-i18next';
import i18n from './src/helpers/config/Il8n';
import {GlobalSocketProvider} from './src/providers/GlobalSocketProvider';
import soundHelper from './src/helpers/config/SoundHelperAndroid';

import SpInAppUpdates, {
  StartUpdateOptions,
  IAUUpdateKind,
} from 'sp-react-native-in-app-updates';
import {ThemeProvider} from './src/providers/ThemeProvider';
import {useNetworkConnection} from './src/hooks/config/useNetworkConnection';
import ConnectionBlockedView from './src/views/ConnectionBlockedView';

import {CopilotProvider} from 'react-native-copilot';
import CopilotTooltip from './src/components/general/CopilotTooltip';
import {svgMaskPath, StepBadge} from './src/helpers/general/CopilotHelper';
import useKioskAutoInit from './src/hooks/config/useKioskAutoInit';
import SyncIndicator from './src/components/config/SyncIndicator';
import SocketStatusIndicator from './src/components/config/SocketStatusIndicator';
import PermanentImageCache from './src/helpers/config/PermanentImageCache';
import CompanyImagePreloader from './src/helpers/config/CompanyImagePreloader';
import useCompanyImagePreloader from './src/hooks/config/useCompanyImagePreloader';

const inAppUpdates = new SpInAppUpdates(false);

const AppContent = () => {
  const {hasInternetConnection} = useNetworkConnection();
  useKioskAutoInit();
  
  // 🏢 Precargar imágenes de empresa automáticamente
  useCompanyImagePreloader();

  return (
    <>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <NavigationComponent />
        <SyncIndicator />
        <SocketStatusIndicator />
      </View>
      {!hasInternetConnection && <ConnectionBlockedView />}
    </>
  );
};

function App(): React.JSX.Element {
  useEffect(() => {
    // 🔥 Inicializar caché permanente de imágenes - PRIMERA PRIORIDAD
    PermanentImageCache.initialize().then(() => {
      console.log('🔥 [App] Caché permanente de imágenes inicializado - ¡NUNCA MÁS PARPADEOS!');
    }).catch(error => {
      console.error('🔥 [App] Error inicializando caché permanente:', error);
    });

    try {
      soundHelper.initializeSounds();
      console.log('🔊 [App] Sonidos inicializados correctamente');
    } catch (error) {
      console.warn('⚠️ [App] Error al inicializar sonidos:', error);
    }

    inAppUpdates
      .checkNeedsUpdate()
      .then(result => {
        if (result.shouldUpdate) {
          let updateOptions: StartUpdateOptions = {};
          if (Platform.OS === 'android') {
            updateOptions = {
              updateType: IAUUpdateKind.IMMEDIATE,
            };
          }
          inAppUpdates.startUpdate(updateOptions);
        }
      })
      .catch(error => {
        console.log('Error checking for update: ', error);
      });
  }, []);

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <ThemeProvider>
            <GlobalSocketProvider>
              <CopilotProvider
                overlay="svg"
                svgMaskPath={svgMaskPath}
                stepNumberComponent={StepBadge}
                arrowColor="transparent"
                tooltipStyle={{
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'transparent',
                  padding: 0,
                }}
                tooltipComponent={CopilotTooltip}
                backdropColor="rgba(0,0,0,0.6)"
                labels={{
                  next: 'Siguiente',
                  previous: 'Atrás',
                  skip: 'Saltar',
                  finish: 'Listo',
                }}>
                <AppContent />
              </CopilotProvider>
            </GlobalSocketProvider>
          </ThemeProvider>
        </NavigationContainer>
      </I18nextProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
