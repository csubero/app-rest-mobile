/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Image, TouchableOpacity, Text} from 'react-native';
import {CopilotStep, walkthroughable} from 'react-native-copilot';
import Badge from '../general/Badge';

const WalkthroughableView = walkthroughable(View);

const Sidebar = React.memo(
  ({
    styles,
    t,
    companySelected,
    onlyPaymentEnabled,
    showBag,
    showPayment,
    isPaymentEnabled,
    // Removed isMultitabletBlocked - no longer blocking tablets
    totalBagQuantity,
    onLogoPress,
    onLogoLongPress,
    onGoToMenu,
    onGoToBag,
    onPayNow,
  }) => {
    // Lógica unificada de habilitación
    const blockedGlobal = onlyPaymentEnabled; // Removed multitablet blocking
    const canPressMenu = !blockedGlobal;
    const canPressBag = !blockedGlobal;
    // Removed multitablet blocking check
    const canPressPay = isPaymentEnabled && !onlyPaymentEnabled; // mantiene semántica original

    return (
      <View style={styles.sidebar}>
        <TouchableOpacity
          onPress={() => {
            if (false) { // Removed multitablet blocking check
              return; // Bloquea tap simple cuando está bloqueada
            }
            onLogoPress && onLogoPress();
          }}
          onLongPress={onLogoLongPress}
          delayLongPress={3000}
          disabled={onlyPaymentEnabled}
          style={{
            alignItems: 'center',
            paddingVertical: 0,
            maxWidth: '90%',
            opacity: 1, // Removed multitablet blocking opacity
          }}>
          <Image
            source={{uri: companySelected.settings.logo_url}}
            style={styles.logo}
          />
        </TouchableOpacity>

        <View style={styles.sidebarMenu}>
          <CopilotStep text={t('copilot_menu_text')} order={1} name="menu-btn">
            <WalkthroughableView
              style={{
                marginTop: 0,
                backgroundColor: 'transparent',
                borderRadius: 8,
                padding: 4,
              }}>
              <TouchableOpacity
                style={[
                  styles.sidebarButton,
                  !showBag && !showPayment && styles.sidebarButtonActive,
                  !canPressMenu && styles.sidebarButtonDisabled,
                ]}
                onPress={() => {
                  if (!canPressMenu) {
                    return;
                  }
                  onGoToMenu && onGoToMenu();
                }}
                disabled={!canPressMenu}>
                <Image
                  source={{
                    uri: companySelected.settings.icon_menu_url,
                    cache: 'force-cache',
                  }}
                  style={[
                    styles.sidebarIcon,
                    !showBag && !showPayment && styles.sidebarIconActive,
                    !canPressMenu && styles.sidebarIconDisabled,
                  ]}
                />
                <Text
                  style={[
                    styles.sidebarText,
                    !showBag && !showPayment && styles.sidebarTextActive,
                    !canPressMenu && styles.sidebarTextDisabled,
                  ]}>
                  {t('menu')}
                </Text>
              </TouchableOpacity>
            </WalkthroughableView>
          </CopilotStep>

          <CopilotStep
            text={t('copilot_order_text')}
            order={2}
            name="order-btn">
            <WalkthroughableView
              style={{
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderRadius: 8,
                padding: 4,
              }}>
              <TouchableOpacity
                style={[
                  styles.sidebarButton,
                  showBag && styles.sidebarButtonActive,
                  !canPressBag && styles.sidebarButtonDisabled,
                ]}
                onPress={() => {
                  if (!canPressBag) {
                    return;
                  }
                  onGoToBag && onGoToBag();
                }}
                disabled={!canPressBag}>
                <View style={{position: 'relative'}}>
                  <Image
                    source={{
                      uri: companySelected.settings.icon_order_url,
                      cache: 'force-cache',
                    }}
                    style={[
                      styles.sidebarIcon,
                      showBag && styles.sidebarIconActive,
                      !canPressBag && styles.sidebarIconDisabled,
                    ]}
                  />
                  <Badge
                    visible={totalBagQuantity > 0}
                    count={totalBagQuantity > 0 ? totalBagQuantity : null}
                  />
                </View>
                <Text
                  style={[
                    styles.sidebarText,
                    showBag && styles.sidebarTextActive,
                    !canPressBag && styles.sidebarTextDisabled,
                  ]}>
                  {t('order')}
                </Text>
              </TouchableOpacity>
            </WalkthroughableView>
          </CopilotStep>

          <CopilotStep
            text={t('copilot_payment_text')}
            order={5}
            name="payment-btn">
            <WalkthroughableView
              style={{
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderRadius: 8,
                padding: 4,
              }}>
              <TouchableOpacity
                style={[
                  styles.sidebarButton,
                  showPayment && styles.sidebarButtonActive,
                  !canPressPay && {opacity: 0.5},
                  !canPressPay && styles.sidebarButtonDisabled,
                ]}
                disabled={!canPressPay}
                onPress={onPayNow}>
                <Image
                  source={{
                    uri: companySelected.settings.icon_payment_url,
                    cache: 'force-cache',
                  }}
                  style={[
                    styles.sidebarIcon,
                    showPayment && styles.sidebarIconActive,
                    !canPressPay && styles.sidebarIconDisabled,
                  ]}
                />
                <Text
                  style={[
                    styles.sidebarText,
                    showPayment && styles.sidebarTextActive,
                    !canPressPay && styles.sidebarTextDisabled,
                  ]}>
                  {t('pay_now')}
                </Text>
              </TouchableOpacity>
            </WalkthroughableView>
          </CopilotStep>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator to prevent unnecessary re-renders
    return (
      prevProps.showBag === nextProps.showBag &&
      prevProps.showPayment === nextProps.showPayment &&
      prevProps.isPaymentEnabled === nextProps.isPaymentEnabled &&
      prevProps.onlyPaymentEnabled === nextProps.onlyPaymentEnabled &&
      prevProps.totalBagQuantity === nextProps.totalBagQuantity &&
      prevProps.onLogoPress === nextProps.onLogoPress &&
      prevProps.onLogoLongPress === nextProps.onLogoLongPress &&
      prevProps.onGoToMenu === nextProps.onGoToMenu &&
      prevProps.onGoToBag === nextProps.onGoToBag &&
      prevProps.onPayNow === nextProps.onPayNow
    );
  },
);

export default Sidebar;
