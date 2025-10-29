package com.arh.apprestmobile;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.kinpos.dcl_lib_client.DCL_Result;
import com.kinpos.dcl_lib_client.comm.DCL_Ethernet;
import com.kinpos.dcl_lib_client.core.DCL_TAG;

import java.math.BigDecimal;
import java.util.Objects;

public class PaymentModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext _context = null;

    PaymentModule(ReactApplicationContext context) {
        super(context);
        _context = context;
    }

    @Override
    public String getName() {
        return "PaymentModule";
    }

    @ReactMethod
    public void capturePayment(Double total, String deviceIp, String currencyCode, Promise promise) {
        Log.d("PaymentModule", "Ejecutando captura de pago: " + total + " Dispositivo: " + deviceIp + " Moneda: " + currencyCode);

        try {
            BigDecimal amount = new BigDecimal(total);
            // Solo tomar los dos decimales, tomar en cuenta que tipo es Double
            amount = amount.setScale(2, BigDecimal.ROUND_HALF_UP);
            String amountStr = amount.multiply(new BigDecimal(100)).toString();
            // Quitar lo que esta a la derecha del punto
            amountStr = amountStr.substring(0, amountStr.indexOf("."));

            DCL_Ethernet dclEthernet = new DCL_Ethernet(_context);

            dclEthernet.setiP(deviceIp);
            dclEthernet.setPort(5000);
            dclEthernet.setTimeOut(90000);
            // dclEthernet.setAmount("10000");
            dclEthernet.setAmount(amountStr);
            dclEthernet.setCurrency(currencyCode);
            dclEthernet.setPrintBeforeSendData(true);
            dclEthernet.setOpenChannel(true);
            dclEthernet.setUseContactlessAmount(true);

            DCL_Result dclResult = dclEthernet.Sale(new byte[][]{
                    DCL_TAG._TxnRspCode, // 0 Código de Respuesta ASCII
                    DCL_TAG._TxnAuthNum, // 1 Número de Autorización ASCII
                    DCL_TAG._TxnDate, // 2 Fecha de la transacción BCD (HHMMSS)
                    DCL_TAG._TxnTime, // 3 Hora de la transacción BCD (AAAAMMDD)
                    DCL_TAG._TxnTID, // 4 Terminal Id ASCII
                    DCL_TAG._TxnMerName, // 5 Id del comercio ASCII
                    DCL_TAG._TxnMaskPAN, // 6 Tarjeta Enmascarada ASCII
                    DCL_TAG._TxnInvoice, // 7 Factura BCD
                    DCL_TAG._TxnIssName, // 8 Emisor ASCII
                    DCL_TAG._TxnEMVDataEND, // 9 Datos EMV para Chip y Contactless BCD
                    DCL_TAG._TxnRRN, // 10 Referencia ASCII
                    DCL_TAG._TxnSTAN, // 11 System Trace Number BCD
                    DCL_TAG._TxnHolderName, // 12 Nombre del Tarjeta Habiente ASCII
                    DCL_TAG._TxnRspText, // 13 Text Respuesta
                    DCL_TAG._TxnCardEntryMode, // 14 Entry Mode : 'I' / CHIP , 'C' - Contacless, 'S' - Banda BCD
            });

            dclEthernet.CloseChannel();

            if (dclResult != null) {
                String responseCode = dclResult.GetValue_ASCII2String(0);
                String responseText = dclResult.GetValue_ASCII2String(13);

                if (Objects.equals(responseCode, "00")) {
                    String authNumber = dclResult.GetValue_ASCII2String(1);
                    String dateTransaction = dclResult.GetValue_BCD2String(2);
                    String timeTransaction = dclResult.GetValue_BCD2String(3);
                    String maskPanCard = dclResult.GetValue_ASCII2String(6);
                    String transactionReference = dclResult.GetValue_ASCII2String(10);
                    String invoiceNumber = dclResult.GetValue_BCD2String(7);
                    String terminalId = dclResult.GetValue_ASCII2String(4);
                    String entryMode = dclResult.GetValue_ASCII2String(14);
                    String merchantId = dclResult.GetValue_ASCII2String(5);

                    WritableMap result = Arguments.createMap();

                    result.putString("authNumber", authNumber);
                    result.putString("dateTransaction", dateTransaction);
                    result.putString("timeTransaction", timeTransaction);
                    result.putString("maskPanCard", maskPanCard);
                    result.putString("transactionReference", transactionReference);
                    result.putString("invoiceNumber", invoiceNumber);
                    result.putString("terminalId", terminalId);
                    result.putString("entryMode", entryMode);
                    result.putString("merchantId", merchantId);
                    result.putString("responseText", responseText);
                    result.putString("amount", amount.toString());

                    promise.resolve(result);

                } else {
                    Log.e("PaymentModule", "Error al capturar el pago: " + responseText);
                    promise.reject("Error", "Error al procesar el pago: " + responseText);
                }
            } else {
                Log.e("PaymentModule", "Error de comunicación con el dispositivo de pago");
                promise.reject("Error", "Error de comunicación con el dispositivo de pago");
            }
        } catch (Exception e) {
            Log.e("PaymentModule", "Error al capturar el pago: " + e.getMessage());
            promise.reject("Error", "Error al capturar el pago: " + e.getMessage());
        }
    }

    @ReactMethod
    public void voidTransaction(String invoiceNumber, String deviceIp, Promise promise) {
        Log.d("PaymentModule", "Ejecutando anulacion de pago: " + invoiceNumber + " Dispositivo: " + deviceIp);

        try {
            DCL_Ethernet dclEthernet = new DCL_Ethernet(_context);

            dclEthernet.setiP(deviceIp);
            dclEthernet.setPort(5000);
            dclEthernet.setTimeOut(90000);
            dclEthernet.setInvoice(invoiceNumber);
            dclEthernet.setPrintBeforeSendData(true);
            dclEthernet.setOpenChannel(true);

            DCL_Result dclResult = dclEthernet.Void(null);

            if (dclResult != null) {
                String responseCode = dclResult.GetValue_ASCII2String(0);

                if (Objects.equals(responseCode, "00")) {
                    String authNumber = dclResult.GetValue_ASCII2String(1);
                    String rrnStr = dclResult.GetValue_ASCII2String(2);
                    String invoiceNumberResponse = dclResult.GetValue_BCD2String(3);
                    String stan = dclResult.GetValue_BCD2String(4);

                    WritableMap result = Arguments.createMap();
                    result.putString("authNumber", authNumber);
                    result.putString("rrn", rrnStr);
                    result.putString("invoiceNumber", invoiceNumberResponse);
                    result.putString("stan", stan);

                    promise.resolve(result);

                } else {
                    Log.e("PaymentModule", "Error al anular el pago: " + dclResult.GetValue_ASCII2String(13));
                    promise.reject("Error", "Error al tratar de anular el pago");
                }

            } else {
                Log.e("PaymentModule", "Error de comunicación con el dispositivo de pago");
                promise.reject("Error", "Error de comunicación con el dispositivo de pago");
            }

            dclEthernet.CloseChannel();

        } catch (Exception e) {
            Log.e("PaymentModule", "Error al anular el pago: " + e.getMessage());
            promise.reject("Error", e.getMessage());
        }
    }

    @ReactMethod
    public void batchClose(String deviceIp, Promise promise) {
        Log.d("PaymentModule", "Ejecutando cierre de lote: " + deviceIp);

        try {
            DCL_Ethernet dclEthernet = new DCL_Ethernet(_context);

            dclEthernet.setiP(deviceIp);
            dclEthernet.setPort(5000);
            dclEthernet.setTimeOut(90000);
            dclEthernet.setOpenChannel(true);
            dclEthernet.setSettlement_ShowTotal(true);

            DCL_Result dclResult = dclEthernet.Settlement(null);

            dclEthernet.CloseChannel();

            if (dclResult != null) {
                String responseCode = dclResult.GetValue_ASCII2String(0);

                if (Objects.equals(responseCode, "00")) {
                    String responseMessage = dclResult.GetValue_ASCII2String(1);
                    String batchTotalStr = dclResult.GetValue_ASCII2String(2);
                    String batchNumberStr = dclResult.GetValue_ASCII2String(3);
                    String merchantName = dclResult.GetValue_ASCII2String(4);
                    String dateBatch = dclResult.GetValue_ASCII2String(5);
                    String timeBatch = dclResult.GetValue_ASCII2String(6);
                    int lengthSize = 15;
                    String[] totalList = new String[4];

                    for (int i = 0; i < 4; i++) {
                        totalList[i] = batchTotalStr.substring(i * lengthSize, (i + 1) * lengthSize);
                    }

                    String totalSalesStr = totalList[0].substring(3, totalList[0].length() - 2) + "." + totalList[0].substring(totalList[0].length() - 2);
                    BigDecimal totalSales = new BigDecimal(totalSalesStr);

                    String totalRefundsStr = totalList[1].substring(3, totalList[1].length() - 2) + "." + totalList[1].substring(totalList[1].length() - 2);
                    BigDecimal totalRefunds = new BigDecimal(totalRefundsStr);

                    totalSalesStr = totalList[2].substring(3, totalList[2].length() - 2) + "." + totalList[2].substring(totalList[2].length() - 2);
                    totalSales = totalSales.add(new BigDecimal(totalSalesStr));

                    totalRefundsStr = totalList[3].substring(3, totalList[3].length() - 2) + "." + totalList[3].substring(totalList[3].length() - 2);
                    totalRefunds = totalRefunds.add(new BigDecimal(totalRefundsStr));

                    BigDecimal total = totalSales.subtract(totalRefunds);

                    WritableMap result = Arguments.createMap();
                    result.putString("responseMessage", responseMessage);
                    result.putString("batchNumber", batchNumberStr);
                    result.putString("merchantName", merchantName);
                    result.putString("dateBatch", dateBatch);
                    result.putString("timeBatch", timeBatch);
                    result.putString("totalSales", totalSales.toString());
                    result.putString("totalRefunds", totalRefunds.toString());
                    result.putString("total", total.toString());

                    promise.resolve(result);

                } else {
                    Log.e("PaymentModule", "Error al cerrar el lote: " + dclResult.GetValue_ASCII2String(13));
                    promise.reject("Error", "Error al tratar de cerrar el lote");
                }

            } else {
                Log.e("PaymentModule", "Error de comunicación con el dispositivo de pago");
                promise.reject("Error", "Error de comunicación con el dispositivo de pago");
            }

        } catch (Exception e) {
            Log.e("PaymentModule", "Error al cerrar el lote: " + e.getMessage());
            promise.reject("Error", e.getMessage());
        }
    }
}
