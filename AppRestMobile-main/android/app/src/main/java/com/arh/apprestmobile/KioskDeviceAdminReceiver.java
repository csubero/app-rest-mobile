package com.arh.apprestmobile;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Device Admin Receiver para manejar políticas de kiosk
 * Requerido para usar DevicePolicyManager y aplicar restricciones del sistema
 */
public class KioskDeviceAdminReceiver extends DeviceAdminReceiver {

    private static final String TAG = "KioskDeviceAdmin";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "🔐 Device Admin habilitado para kiosk mode");
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.d(TAG, "🚪 Device Admin deshabilitado");
    }

    @Override
    public void onLockTaskModeEntering(Context context, Intent intent, String pkg) {
        super.onLockTaskModeEntering(context, intent, pkg);
        Log.d(TAG, "📱 Entrando en Lock Task Mode: " + pkg);
    }

    @Override
    public void onLockTaskModeExiting(Context context, Intent intent) {
        super.onLockTaskModeExiting(context, intent);
        Log.d(TAG, "🚪 Saliendo de Lock Task Mode");
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return "⚠️ Deshabilitar Device Admin permitirá el acceso completo al dispositivo. ¿Continuar?";
    }
}
