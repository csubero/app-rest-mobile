// src/views/PaymentView/components/PaymentMethods.jsx
import React from 'react';
import {View, StyleSheet} from 'react-native';
import SelectPaymentStep from '../SubViews/SelectPaymentStep';
import LoyaltyCardNumber from '../SubViews/LoyaltyCardNumber';
import LoyaltyPoints from '../SubViews/LoyaltyPoints';
import LoyaltyTokenInput from '../SubViews/LoyaltyTokenInput';
import LoyaltyCardAccumulate from '../SubViews/LoyaltyCardAccumulate';
import QRPayment from '../SubViews/QRPayment';
import CancelPaymentDialog from '../SubViews/CancelPaymentDialog';
import AccumulatePointsDialog from '../SubViews/AccumulatePointsDialog';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

const PaymentMethods = ({
  // Payment method states
  paymentMethod,
  loyaltyCardType,

  // Loyalty states
  user,
  tempUser,
  accumulateUser,
  loyaltyToken,
  tokenValidated,
  loading,
  error,
  idNumber,
  isAccumulatingPoints,

  // QR states
  qrPaymentUrl,
  qrLoading,
  qrError,
  paymentStatus,
  paymentId,
  showCancelDialog,
  cancelLoading,
  setShowCancelDialog,

  // Dialog states
  showAccumulateDialog,

  // Amounts and data
  totalAmount,
  currency,
  baseBag,
  orderConfirmedApiId,

  // Actions
  setPaymentMethod,
  setIdNumber,
  handleLoyaltyPlan,
  resetPaymentMethod,
  handleDatafono,
  handleSelectedPaymentMethod,
  handlePoints,
  setTotalAmount,
  captureFullPayment,
  setLoading,
  setRedeemPoints,
  setUser,
  setAccumulateUser,
  setTokenValidated,
  setLoyaltyToken,
  handleManualCancelPayment,
  confirmCancelPayment,
  keepPaying,
  handleRemoveBag,
  handleAccumulatePoints,
  handleSkipPoints,
  handleCancelAccumulate,
  handleConfirmAccumulate,
  calculateRemainingAmount,
  setOnlyPaymentEnabled,
  companySelected,

  // Navigation
  navigation,
}) => {
  // Check conditions for LoyaltyCardAccumulate
  const shouldShowAccumulate =
    paymentMethod === 'loyalty' &&
    loyaltyCardType === 'accumulate' &&
    accumulateUser &&
    tokenValidated &&
    !loading;

  // Loyalty token component
  let loyaltyTokenComponent = null;
  if (
    paymentMethod === 'loyalty' &&
    loyaltyCardType &&
    loyaltyCardType !== 'accumulate' &&
    !loading &&
    loyaltyToken &&
    !tokenValidated // Solo mostrar si no está validado aún
  ) {
    loyaltyTokenComponent = (
      <LoyaltyTokenInput
        loyaltyToken={loyaltyToken}
        setLoyaltyToken={setLoyaltyToken}
        resetPaymentMethod={resetPaymentMethod}
        loyaltyCardType={loyaltyCardType}
        setUser={setUser}
        setAccumulateUser={setAccumulateUser}
        tempUser={tempUser}
        setTokenValidated={setTokenValidated}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Accumulate Points Dialog */}
      {showAccumulateDialog && (
        <AccumulatePointsDialog
          onAccumulatePoints={handleAccumulatePoints}
          onSkipPoints={handleSkipPoints}
          onCancel={handleCancelAccumulate}
        />
      )}
      {/* Select Payment Step */}
      {!paymentMethod && !showAccumulateDialog && (
        <SelectPaymentStep
          setPaymentMethod={setPaymentMethod}
          handleDatafono={handleDatafono}
          navigation={navigation}
          handleSelectedPaymentMethod={handleSelectedPaymentMethod}
          tablet={{
            orderConfirmedApiId: orderConfirmedApiId,
            order: baseBag,
          }}
          setTotalAmount={setTotalAmount}
          baseBag={baseBag}
          orderConfirmedApiId={orderConfirmedApiId}
          totalAmount={totalAmount}
          captureFullPayment={captureFullPayment}
        />
      )}
      {/* Loyalty Card Number Input */}
      {paymentMethod === 'loyalty' &&
        loyaltyCardType &&
        loyaltyCardType !== 'accumulate' &&
        !user &&
        !loyaltyToken &&
        !loading && (
          <LoyaltyCardNumber
            idNumber={idNumber}
            setIdNumber={setIdNumber}
            error={error}
            resetPaymentMethod={resetPaymentMethod}
            loyaltyCardType={loyaltyCardType}
            handleLoyaltyPlan={handleLoyaltyPlan}
          />
        )}
      {/* Loyalty Card Number Input for Accumulate */}
      {paymentMethod === 'loyalty' &&
        loyaltyCardType === 'accumulate' &&
        !accumulateUser &&
        !tokenValidated && // Solo mostrar si no está validado aún
        !loading && (
          <LoyaltyCardNumber
            idNumber={idNumber}
            setIdNumber={setIdNumber}
            error={error}
            resetPaymentMethod={resetPaymentMethod}
            loyaltyCardType={loyaltyCardType}
            handleLoyaltyPlan={handleLoyaltyPlan}
          />
        )}
      {/* Loyalty Card Accumulate */}
      {shouldShowAccumulate && (
        <LoyaltyCardAccumulate
          user={accumulateUser}
          onAccumulate={handleConfirmAccumulate}
          onCancel={resetPaymentMethod}
          loading={loading}
          currency={currency}
        />
      )}
      {/* Loyalty Points */}
      {user !== null &&
        tokenValidated &&
        !loading &&
        paymentMethod !== 'card' &&
        loyaltyCardType !== 'accumulate' && (
          <LoyaltyPoints
            user={user}
            totalAmount={totalAmount}
            currency={currency}
            calculateRemainingAmount={calculateRemainingAmount}
            handlePoints={handlePoints}
            setPaymentMethod={setPaymentMethod}
            setTotalAmount={setTotalAmount}
            resetPaymentMethod={resetPaymentMethod}
            captureFullPayment={captureFullPayment}
            setLoading={setLoading}
            setRedeemPoints={setRedeemPoints}
            onAccumulate={handleConfirmAccumulate}
            setAccumulateUser={setAccumulateUser}
            setOnlyPaymentEnabled={setOnlyPaymentEnabled}
          />
        )}
      {/* Loyalty Token Input */}
      {loyaltyTokenComponent}
      {/* QR Payment */}
      {paymentMethod === 'card' && !showCancelDialog && (
        <QRPayment
          resetPaymentMethod={handleManualCancelPayment}
          resetLocalState={resetPaymentMethod}
          setShowCancelDialog={setShowCancelDialog}
          setOnlyPaymentEnabled={setOnlyPaymentEnabled}
          totalAmount={totalAmount}
          handleRemoveBag={handleRemoveBag}
          navigation={navigation}
          paymentQrUrl={qrPaymentUrl}
          qrLoading={qrLoading}
          qrError={qrError}
          paymentStatus={paymentStatus}
          paymentId={paymentId}
          companySelected={companySelected}
        />
      )}
      {/* Cancel Payment Dialog */}
      {paymentMethod === 'card' && showCancelDialog && (
        <CancelPaymentDialog
          onConfirmCancel={confirmCancelPayment}
          onKeepPaying={keepPaying}
          isLoading={cancelLoading}
        />
      )}
    </View>
  );
};

export default PaymentMethods;
