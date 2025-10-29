package com.arh.apprestmobile;

import static android.content.Context.USB_SERVICE;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class PrinterModule extends ReactContextBaseJavaModule {
    private static final String ACTION_USB_PERMISSION = "com.arh.apprestmobile.USB_PERMISSION";
    private UsbManager usbManager;
    private PendingIntent permissionIntent;
    private Promise permissionPromise;

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null && permissionPromise != null) {
                            permissionPromise.resolve("Permission granted");
                        }
                    } else {
                        if (permissionPromise != null) {
                            permissionPromise.reject("Error", "Permission denied");
                        }
                    }
                    permissionPromise = null;
                }
            }
        }
    };

    @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
    PrinterModule(ReactApplicationContext context) {
        super(context);
        usbManager = (UsbManager) context.getSystemService(USB_SERVICE);
        permissionIntent = PendingIntent.getBroadcast(context, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE);
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        }
    }

    @Override
    public String getName() {
        return "PrinterModule";
    }

    @ReactMethod
    public void getUsbDevices(Promise promise) {
        Log.d("PrinterModule", "Obteniendo dispositivos USB...");
        try {
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            WritableArray devicesArray = Arguments.createArray();

            for (UsbDevice device : deviceList.values()) {
                WritableMap deviceInfo = Arguments.createMap();

                deviceInfo.putString("deviceName", device.getDeviceName());
                deviceInfo.putInt("deviceId", device.getDeviceId());
                deviceInfo.putInt("vendorId", device.getVendorId());
                deviceInfo.putInt("productId", device.getProductId());
                deviceInfo.putString("productName", device.getProductName());

                if (device.getInterfaceCount() > 0) {
                    for (int i = 0; i < device.getInterfaceCount(); i++) {
                        int interfaceClass = device.getInterface(i).getInterfaceClass();
                        switch (interfaceClass) {
                            case UsbConstants.USB_CLASS_COMM:
                                deviceInfo.putString("deviceType", "Communication Device");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_COMM");
                                break;
                            case UsbConstants.USB_CLASS_HID:
                                deviceInfo.putString("deviceType", "Human Interface Device");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_HID");
                                break;
                            case UsbConstants.USB_CLASS_MASS_STORAGE:
                                deviceInfo.putString("deviceType", "Mass Storage");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_MASS_STORAGE");
                                break;
                            case UsbConstants.USB_CLASS_PRINTER:
                                deviceInfo.putString("deviceType", "Printer");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_PRINTER");
                                break;
                            case UsbConstants.USB_CLASS_CDC_DATA:
                                deviceInfo.putString("deviceType", "CDC Data");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_CDC_DATA");
                                break;
                            case UsbConstants.USB_CLASS_PHYSICA:
                                deviceInfo.putString("deviceType", "Physical");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_PHYSICA");
                                break;
                            case UsbConstants.USB_CLASS_STILL_IMAGE:
                                deviceInfo.putString("deviceType", "Imaging");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_STILL_IMAGE");
                                break;
                            case UsbConstants.USB_CLASS_WIRELESS_CONTROLLER:
                                deviceInfo.putString("deviceType", "Wireless Controller");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_WIRELESS_CONTROLLER");
                                break;
                            case UsbConstants.USB_CLASS_MISC:
                                deviceInfo.putString("deviceType", "Miscellaneous");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_MISC");
                                break;
                            case UsbConstants.USB_CLASS_APP_SPEC:
                                deviceInfo.putString("deviceType", "Application Specific");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_APP_SPEC");
                                break;
                            case UsbConstants.USB_CLASS_VENDOR_SPEC:
                                deviceInfo.putString("deviceType", "Vendor Specific");
                                deviceInfo.putString("deviceTypeCode", "USB_CLASS_VENDOR_SPEC");
                                break;
                            default:
                                deviceInfo.putString("deviceType", "Unknown");
                                deviceInfo.putString("deviceTypeCode", "UNKNOWN");
                                break;
                        }
                    }
                } else {
                    deviceInfo.putString("deviceType", "Unknown");
                }

                devicesArray.pushMap(deviceInfo);
            }
            Log.d("PrinterModule", "Dispositivos USB obtenidos: " + devicesArray.toString());
            // Toast.makeText(getReactApplicationContext(), "Dispositivos USB obtenidos: " + devicesArray.toString(), Toast.LENGTH_LONG).show();
            promise.resolve(devicesArray);

        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    @ReactMethod
    public void requestUsbPermission(String deviceName, Promise promise) {
        UsbDevice device = null;
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
            if (entry.getValue().getDeviceName().equals(deviceName)) {
                device = entry.getValue();
                break;
            }
        }

        if (device == null) {
            promise.reject("Error", "Device not found");
            return;
        }

        if (usbManager.hasPermission(device)) {
            promise.resolve("Permission already granted");
        } else {
            permissionPromise = promise;
            usbManager.requestPermission(device, permissionIntent);
        }
    }

    @ReactMethod
    public void printTicket(ReadableArray ticketData, String deviceName, Promise promise) {
        UsbDevice device = null;
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
            if (entry.getValue().getDeviceName().equals(deviceName)) {
                device = entry.getValue();
                break;
            }
        }

        if (device == null) {
            promise.reject("Error", "Device not found");
            return;
        }

        UsbInterface usbInterface = null;
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            if (device.getInterface(i).getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) {
                usbInterface = device.getInterface(i);
                break;
            }
        }

        if (usbInterface == null) {
            promise.reject("Error", "Printer interface not found");
            return;
        }

        UsbDeviceConnection connection = usbManager.openDevice(device);
        if (connection == null || !connection.claimInterface(usbInterface, true)) {
            promise.reject("Error", "Failed to open connection or claim interface");
            return;
        }

        UsbEndpoint endpoint = null;
        for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
            if (usbInterface.getEndpoint(i).getType() == UsbConstants.USB_ENDPOINT_XFER_BULK &&
                    usbInterface.getEndpoint(i).getDirection() == UsbConstants.USB_DIR_OUT) {
                endpoint = usbInterface.getEndpoint(i);
                break;
            }
        }

        if (endpoint == null) {
            promise.reject("Error", "Bulk OUT endpoint not found");
            connection.releaseInterface(usbInterface);
            connection.close();
            return;
        }

        try {
            // Se envía el comando de inicialización de la impresora
            byte[] initCmd = new byte[]{27, 64}; // ESC @
            connection.bulkTransfer(endpoint, initCmd, initCmd.length, 10000);

            // Se envían 4 saltos de línea para dar margen superior
            for (int i = 0; i < 2; i++) {
                byte[] lineFeed = new byte[]{10}; // LF
                connection.bulkTransfer(endpoint, lineFeed, lineFeed.length, 10000);
            }

            // Se itera sobre los elementos del ticket
            for (int i = 0; i < ticketData.size(); i++) {
                ReadableMap ticketItem = ticketData.getMap(i);
                String text = ticketItem.getString("text");
                int fontSize = ticketItem.getInt("fontSize");
                String alignment = ticketItem.getString("alignment");
                int marginBottom = ticketItem.getInt("marginBottom");

                // Comando para cambiar el tamaño de la fuente
                int size = Math.max(1, Math.min(fontSize, 8));
                byte[] fontSizeCmd = new byte[]{29, 33, (byte) ((size - 1) * 17)};
                connection.bulkTransfer(endpoint, fontSizeCmd, fontSizeCmd.length, 10000);

                // Comando para alinear el texto
                byte[] alignCmd;

                switch (Objects.requireNonNull(alignment).toLowerCase()) {
                    case "center":
                        alignCmd = new byte[]{27, 97, 1}; // ESC a 1
                        break;
                    case "right":
                        alignCmd = new byte[]{27, 97, 2}; // ESC a 2
                        break;
                    case "left":
                    default:
                        alignCmd = new byte[]{27, 97, 0}; // ESC a 0
                        break;
                }
                connection.bulkTransfer(endpoint, alignCmd, alignCmd.length, 10000);

                // Se imprime el texto
                byte[] data = formatTextForLineWidth(replaceAccentsAndN(text), 48).getBytes(StandardCharsets.UTF_8);
                int result = connection.bulkTransfer(endpoint, data, data.length, 10000);

                // Comandos para generar QR Code
                String qrData = ticketItem.getString("qrData");

                if (!qrData.equals("")) {
                    byte modelCmd[] = {29, 40, 107, 4, 0, 49, 65, 49, 0}; // Select model
                    connection.bulkTransfer(endpoint, modelCmd, modelCmd.length, 10000);

                    byte sizeCmd[] = {29, 40, 107, 3, 0, 49, 67, 6}; // Set module size (1-8)
                    connection.bulkTransfer(endpoint, sizeCmd, sizeCmd.length, 10000);

                    byte errorCmd[] = {29, 40, 107, 3, 0, 49, 69, 48}; // Set error correction level
                    connection.bulkTransfer(endpoint, errorCmd, errorCmd.length, 10000);

                    byte storeCmd[] = {29, 40, 107, (byte) (3 + qrData.length()), 0, 49, 80, 48}; // Store data in symbol storage area
                    byte[] qrDataBytes = qrData.getBytes(StandardCharsets.ISO_8859_1);
                    byte[] storeData = new byte[storeCmd.length + qrDataBytes.length];
                    System.arraycopy(storeCmd, 0, storeData, 0, storeCmd.length);
                    System.arraycopy(qrDataBytes, 0, storeData, storeCmd.length, qrDataBytes.length);
                    connection.bulkTransfer(endpoint, storeData, storeData.length, 10000);

                    byte printCmd[] = {29, 40, 107, 3, 0, 49, 81, 48}; // Print symbol data
                    connection.bulkTransfer(endpoint, printCmd, printCmd.length, 10000);
                }

                // Se envía un salto de línea para dar margen inferior
                for (int j = 0; j < marginBottom; j++) {
                    byte[] lineFeed = new byte[]{10}; // LF
                    connection.bulkTransfer(endpoint, lineFeed, lineFeed.length, 10000);
                }
            }

            // Finalmente se envían 2 saltos de línea para dar margen inferior

            for (int j = 0; j < 3; j++) {
                byte[] lineFeed = new byte[]{10}; // LF
                connection.bulkTransfer(endpoint, lineFeed, lineFeed.length, 10000);
            }

            byte[] cutPaper = new byte[]{29, 86, 1}; // GS V 1
            connection.bulkTransfer(endpoint, cutPaper, cutPaper.length, 10000);

            promise.resolve("Ticket printed");
        } catch (Exception e) {
            promise.reject("Error", e);
        } finally {
            connection.releaseInterface(usbInterface);
            connection.close();
        }
    }

    @ReactMethod
    public void printText(String deviceName, String text, Promise promise) {
        Toast.makeText(getReactApplicationContext(), "Imprimiendo texto...", Toast.LENGTH_SHORT).show();
        Toast.makeText(getReactApplicationContext(), "Dispositivo: " + deviceName, Toast.LENGTH_SHORT).show();

        UsbDevice device = null;
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
            if (entry.getValue().getDeviceName().equals(deviceName)) {
                device = entry.getValue();
                break;
            }
        }

        if (device == null) {
            promise.reject("Error", "Device not found");
            return;
        }

        UsbInterface usbInterface = null;
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            if (device.getInterface(i).getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) {
                usbInterface = device.getInterface(i);
                break;
            }
        }

        if (usbInterface == null) {
            promise.reject("Error", "Printer interface not found");
            return;
        }

        UsbDeviceConnection connection = usbManager.openDevice(device);
        if (connection == null || !connection.claimInterface(usbInterface, true)) {
            promise.reject("Error", "Failed to open connection or claim interface");
            return;
        }

        UsbEndpoint endpoint = null;
        for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
            if (usbInterface.getEndpoint(i).getType() == UsbConstants.USB_ENDPOINT_XFER_BULK &&
                    usbInterface.getEndpoint(i).getDirection() == UsbConstants.USB_DIR_OUT) {
                endpoint = usbInterface.getEndpoint(i);
                break;
            }
        }

        if (endpoint == null) {
            promise.reject("Error", "Bulk OUT endpoint not found");
            connection.releaseInterface(usbInterface);
            connection.close();
            return;
        }

        try {
            byte[] initCmd = new byte[]{27, 64}; // ESC @
            connection.bulkTransfer(endpoint, initCmd, initCmd.length, 10000);

            for (int i = 0; i < 3; i++) {
                byte[] lineFeed = new byte[]{10}; // LF
                connection.bulkTransfer(endpoint, lineFeed, lineFeed.length, 10000);
            }

            byte[] data = formatTextForLineWidth(replaceAccentsAndN(text), 48).getBytes(StandardCharsets.UTF_8);
            int result = connection.bulkTransfer(endpoint, data, data.length, 10000);

            for (int i = 0; i < 9; i++) {
                byte[] lineFeed = new byte[]{10}; // LF
                connection.bulkTransfer(endpoint, lineFeed, lineFeed.length, 10000);
            }

            byte[] cutPaper = new byte[]{29, 86, 1}; // GS V 1
            connection.bulkTransfer(endpoint, cutPaper, cutPaper.length, 10000);

            if (result >= 0) {
                promise.resolve("Printed successfully");
            } else {
                promise.reject("Error", "Failed to print");
            }
        } catch (Exception e) {
            promise.reject("Error", e);
        } finally {
            connection.releaseInterface(usbInterface);
            connection.close();
        }
    }

    @ReactMethod
    public void isPrinterConnected(String deviceName, Promise promise) {
        UsbDevice device = null;
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
            if (entry.getValue().getDeviceName().equals(deviceName)) {
                device = entry.getValue();
                break;
            }
        }

        if (device == null) {
            promise.reject("Error", "Device not found");
            return;
        }

        UsbInterface usbInterface = null;
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            if (device.getInterface(i).getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) {
                usbInterface = device.getInterface(i);
                break;
            }
        }

        if (usbInterface == null) {
            promise.reject("Error", "Printer interface not found");
            return;
        }

        UsbDeviceConnection connection = usbManager.openDevice(device);
        if (connection == null || !connection.claimInterface(usbInterface, true)) {
            promise.reject("Error", "Failed to open connection or claim interface");
            return;
        }

        // Si llegas a este punto, la impresora está conectada y encendida
        promise.resolve("Printer is connected and ready");

        // Libera la conexión y la interfaz después de la verificación
        connection.releaseInterface(usbInterface);
        connection.close();
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("USB_CLASS_COMM", "USB_CLASS_COMM");
        constants.put("USB_CLASS_HID", "USB_CLASS_HID");
        constants.put("USB_CLASS_MASS_STORAGE", "USB_CLASS_MASS_STORAGE");
        constants.put("USB_CLASS_PRINTER", "USB_CLASS_PRINTER");
        constants.put("USB_CLASS_CDC_DATA", "USB_CLASS_CDC_DATA");
        constants.put("USB_CLASS_PHYSICA", "USB_CLASS_PHYSICA");
        constants.put("USB_CLASS_STILL_IMAGE", "USB_CLASS_STILL_IMAGE");
        constants.put("USB_CLASS_WIRELESS_CONTROLLER", "USB_CLASS_WIRELESS_CONTROLLER");
        constants.put("USB_CLASS_MISC", "USB_CLASS_MISC");
        constants.put("USB_CLASS_APP_SPEC", "USB_CLASS_APP_SPEC");
        constants.put("USB_CLASS_VENDOR_SPEC", "USB_CLASS_VENDOR_SPEC");
        constants.put("UNKNOWN", "UNKNOWN");

        return constants;
    }

    private String formatTextForLineWidth(String text, int lineWidth) {
        StringBuilder formattedText = new StringBuilder();
        String[] lines = text.split("\n");

        for (String line : lines) {
            while (line.length() > lineWidth) {
                formattedText.append(line, 0, lineWidth).append("\n");
                line = line.substring(lineWidth);
            }
            formattedText.append(line).append("\n");
        }

        return formattedText.toString();
    }

    public static String replaceAccentsAndN(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutAccents = normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        withoutAccents = withoutAccents.replace("ñ", "n").replace("Ñ", "N");
        return withoutAccents;
    }
}
