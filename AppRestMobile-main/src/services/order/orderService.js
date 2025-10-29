import apiClient from '../api/apiClient';
import {
  buildOrderPayload,
  buildUpdateOrderPayload,
  buildEmptyOrderPayload,
} from '../../helpers/utils/OrderUtils';

export const sendOrderToServer = async ({
  serverIp,
  apiToken,
  baseBag,
  baseCompany,
  waiterData = null,
}) => {
  try {
    const payload = buildOrderPayload({baseBag, baseCompany, waiterData});
    const response = await apiClient(serverIp, apiToken).post(
      'orders/init-order/',
      payload,
    );

    console.log('Orden enviada con éxito:', response);
    // console.log(JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error(
      'Error al enviar la orden:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const sendUpdateOrderToServer = async ({
  serverIp,
  apiToken,
  orderId,
  baseBag,
}) => {
  try {
    const payload = buildUpdateOrderPayload({baseBag});
    const response = await apiClient(serverIp, apiToken).put(
      `orders/${orderId}/update-items/`,
      payload,
    );
    return response;
  } catch (error) {
    console.error(
      'Error al actualizar ítems de la orden:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const sendPaymentsToServer = async ({
  serverIp,
  apiToken,
  orderId,
  payment,
}) => {
  try {
    const response = await apiClient(serverIp, apiToken).post(
      `orders/${orderId}/payment/`,
      payment,
    );

    console.log('Pagos enviados con éxito:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al enviar los pagos:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const updateOrderItemStatus = async ({serverIp, apiToken, items}) => {
  try {
    const response = await apiClient(serverIp, apiToken).post(
      'orders/order-item/update-status/',
      items,
    );

    console.log('Estados de ítems actualizados con éxito:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al actualizar el estado de ítems:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const cancelPayment = async ({serverIp, apiToken, paymentId}) => {
  try {
    console.log('Cancelando pago con ID:', paymentId);
    const response = await apiClient(serverIp, apiToken).delete(
      `orders/${paymentId}/payment/delete/`,
    );

    console.log('Pago cancelado exitosamente:', response);
    return {
      success: true,
      message: 'Pago cancelado exitosamente',
      data: response,
    };
  } catch (error) {
    console.error(
      'Error al cancelar el pago:',
      error.response?.data || error.message,
    );
    throw new Error('No se pudo cancelar el pago');
  }
};

export const getOrderDetails = async ({serverIp, apiToken, orderId}) => {
  try {
    const response = await apiClient(serverIp, apiToken).get(
      `orders/${orderId}/detail/`,
    );

    return response;
  } catch (error) {
    console.error(
      'Error al obtener detalles de la orden:',
      error.response?.data || error.message,
    );
    throw new Error('No se pudieron obtener los detalles de la orden');
  }
};

export const cancelOrder = async ({serverIp, apiToken, orderId}) => {
  try {
    console.log('Cancelando orden con ID:', orderId);
    
    const response = await apiClient(serverIp, apiToken).post(
      `orders/${orderId}/cancel/`,
      {}, // Body vacío como especificaste
    );

    console.log('Orden cancelada exitosamente:', response);
    return {
      success: true,
      message: 'Orden cancelada exitosamente',
      data: response,
    };
  } catch (error) {
    console.error(
      'Error al cancelar la orden:',
      error.response?.data || error.message,
    );
    throw new Error('No se pudo cancelar la orden');
  }
};

export const createEmptyOrder = async ({
  serverIp,
  apiToken,
  baseCompany,
  waiterData = null,
}) => {
  try {
    console.log('Creando orden vacía para mesa configurada');

    const payload = buildEmptyOrderPayload({baseCompany, waiterData});

    // Log de información del mesero
    if (waiterData && waiterData.id && waiterData.name) {
      console.log('[createEmptyOrder] Incluyendo datos del mesero:', {
        id: waiterData.id,
        name: waiterData.name,
        password: '***',
      });
    } else {
      console.log('[createEmptyOrder] No se proporcionaron datos del mesero');
    }

    console.log('Payload orden vacía:', JSON.stringify(payload, null, 2));

    const response = await apiClient(serverIp, apiToken).post(
      'orders/init-order/',
      payload,
    );

    console.log(' Orden vacía creada exitosamente:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al crear orden vacía:',
      error.response?.data || error.message,
    );
    throw error;
  }
};
