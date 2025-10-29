// src/services/paymentService.js
import {sendPaymentsToServer} from '../order/orderService';

export const getPaymentType = paymentFlow => {
  if (!paymentFlow.isSplit) {
    return 'full'; // Pago único/total
  }

  if (paymentFlow.splitType === 'equal') {
    return 'split_equal'; // Cuenta dividida igualmente
  }

  if (paymentFlow.splitType === 'products') {
    return 'split_products'; // Pago por productos específicos
  }

  return 'full'; // Valor por defecto
};

export const capturePayment = async ({
  serverIp,
  apiToken,
  amount,
  sendData,
  orderId,
  loyaltyInfo = null,
  userBalance = null,
  redeemedAmount = 0,
  source = 1,
  paymentType = null,
  splits = null,
  proccessPayment = true,
}) => {
  // Extraer información de lealtad
  const isLoyaltyPayment =
    loyaltyInfo && (loyaltyInfo.redeem || loyaltyInfo.accumulate);
  const cardNumber =
    loyaltyInfo?.numero_tarjeta || loyaltyInfo?.cardNumber || null;
  const clientName = loyaltyInfo?.clientName || null;

  const shouldIncludeDetail = true;

  const paymentData = {
    nombre_cliente:
      isLoyaltyPayment && clientName
        ? clientName.split(' ')[0] || clientName
        : null,
    apellido_cliente:
      isLoyaltyPayment && clientName
        ? clientName.split(' ').slice(1).join(' ') || null
        : null,
    fecha_transaccion: new Date().toISOString(),
    monto: amount,
    numero_tarjeta: cardNumber,
    saldo_tarjeta: userBalance || null,
    saldo_canjeado: redeemedAmount || null,
    fuente: source,
    detalle: shouldIncludeDetail ? (sendData.length ? sendData : []) : [],
    tipo_pago: paymentType || 'full',
    procesar_pago: proccessPayment,
  };

  if (paymentType === 'split_equal' && splits) {
    paymentData.pagos_divididos = splits;
  }

  console.log('💳 Payment Data Final:', JSON.stringify(paymentData, null, 2));

  // Agregar el pago
  const response = await sendPaymentsToServer({
    serverIp,
    apiToken,
    orderId,
    payment: paymentData,
  });

  // Extraer el ID del pago de la respuesta
  const paymentId = response.id;

  return {
    order: response,
    paymentData,
    paymentId, // Devolver el ID del pago para cancelación
  };
};
