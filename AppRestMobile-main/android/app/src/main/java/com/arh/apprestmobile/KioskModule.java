package com.arh.apprestmobile;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.UserManager;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.ArrayList;
import java.util.List;

/**
 * Módulo nativo para manejar el modo Kiosk usando LockTask Mode de Android
 * Incluye restricciones avanzadas para WiFi, Bluetooth, configuraciones del sistema
 */
public class KioskModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private boolean isKioskActive = false;
    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;

    public KioskModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(reactContext, KioskDeviceAdminReceiver.class);
    }

    @NonNull
    @Override
    public String getName() {
        return "KioskModule";
    }

    /**
     * Activa el modo kiosk usando LockTask Mode y restricciones del sistema
     */
    @ReactMethod
    public void enableKiosk(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No hay actividad actual disponible");
                return;
            }

            // Activar modo inmersivo completo
            enableImmersiveMode(currentActivity);
            
            // Aplicar restricciones del sistema si somos device owner
            applySystemRestrictions();

            // Intentar activar el modo kiosk
            currentActivity.startLockTask();
            isKioskActive = true;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Modo kiosk activado correctamente con restricciones del sistema");
            result.putBoolean("isDeviceOwner", isDeviceOwner());
            
            promise.resolve(result);
            
        } catch (SecurityException e) {
            // Error de permisos
            isKioskActive = false;
            promise.reject("PERMISSION_DENIED", "La aplicación no tiene permisos para modo kiosk. Debe ser configurada como Device Owner o estar en la whitelist: " + e.getMessage());
        } catch (Exception e) {
            isKioskActive = false;
            promise.reject("KIOSK_ERROR", "Error al activar modo kiosk: " + e.getMessage(), e);
        }
    }

    /**
     * Desactiva el modo kiosk
     */
    @ReactMethod
    public void disableKiosk(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No hay actividad actual disponible");
                return;
            }

            // Remover restricciones del sistema
            removeSystemRestrictions();

            // Deshabilitar modo inmersivo
            disableImmersiveMode(currentActivity);

            currentActivity.stopLockTask();
            isKioskActive = false;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Modo kiosk desactivado correctamente");
            
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("KIOSK_ERROR", "Error al desactivar modo kiosk: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica si el modo kiosk está activo
     */
    @ReactMethod
    public void isKioskActive(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No hay actividad actual disponible");
                return;
            }

            ActivityManager am = (ActivityManager) currentActivity.getSystemService(Context.ACTIVITY_SERVICE);
            
            if (am == null) {
                promise.reject("NO_ACTIVITY_MANAGER", "No se pudo obtener ActivityManager");
                return;
            }

            // Verificar si estamos en Lock Task Mode
            boolean isInLockTaskMode = false;
            int lockTaskModeState = ActivityManager.LOCK_TASK_MODE_NONE;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                lockTaskModeState = am.getLockTaskModeState();
                isInLockTaskMode = lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE;
            } else {
                // Para versiones anteriores, usar el estado interno
                isInLockTaskMode = isKioskActive;
            }
            
            isKioskActive = isInLockTaskMode;
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("isActive", isKioskActive);
            result.putInt("lockTaskModeState", lockTaskModeState);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("KIOSK_ERROR", "Error al verificar estado del kiosk: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica si la app tiene permisos para modo kiosk intentando activarlo temporalmente
     */
    @ReactMethod
    public void checkKioskPermissions(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No hay actividad actual disponible");
                return;
            }

            // Verificar si ya estamos en modo kiosk
            ActivityManager am = (ActivityManager) currentActivity.getSystemService(Context.ACTIVITY_SERVICE);
            boolean currentlyInKiosk = false;
            
            if (am != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                currentlyInKiosk = am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
            }

            boolean hasPermission = true;
            String testResult = "Disponible";

            // Si no estamos en modo kiosk, hacer una prueba rápida
            if (!currentlyInKiosk) {
                try {
                    currentActivity.startLockTask();
                    // Si llegamos aquí, tenemos permisos
                    currentActivity.stopLockTask();
                } catch (SecurityException e) {
                    hasPermission = false;
                    testResult = "Sin permisos: " + e.getMessage();
                } catch (Exception e) {
                    // Otros errores no relacionados con permisos
                    testResult = "Error de prueba: " + e.getMessage();
                }
            }
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("hasPermission", hasPermission);
            result.putString("packageName", currentActivity.getPackageName());
            result.putString("testResult", testResult);
            result.putBoolean("currentlyInKiosk", currentlyInKiosk);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("KIOSK_ERROR", "Error al verificar permisos: " + e.getMessage(), e);
        }
    }

    /**
     * Alterna el estado del modo kiosk
     */
    @ReactMethod
    public void toggleKiosk(Promise promise) {
        if (isKioskActive) {
            disableKiosk(promise);
        } else {
            enableKiosk(promise);
        }
    }

    /**
     * Verifica si la app es Device Owner
     */
    private boolean isDeviceOwner() {
        try {
            return devicePolicyManager != null && devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Aplica restricciones del sistema para modo kiosk completo
     */
    private void applySystemRestrictions() {
        if (!isDeviceOwner()) {
            return;
        }

        try {
            // Bloquear acceso a configuraciones
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_WIFI);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_ADJUST_VOLUME);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_SYSTEM_ERROR_DIALOGS);
            
            // Bloquear notificaciones y barra de estado
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_DATE_TIME);
                devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_OUTGOING_CALLS);
            }

            // Bloquear instalación de apps
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_INSTALL_APPS);
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS);

            // Bloquear configuraciones de red
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            }

            // Configurar aplicaciones permitidas en Lock Task Mode
            List<String> allowedApps = new ArrayList<>();
            allowedApps.add(reactContext.getPackageName());
            devicePolicyManager.setLockTaskPackages(adminComponent, allowedApps.toArray(new String[0]));

        } catch (Exception e) {
            android.util.Log.e("KioskModule", "Error aplicando restricciones: " + e.getMessage());
        }
    }

    /**
     * Remueve restricciones del sistema
     */
    private void removeSystemRestrictions() {
        if (!isDeviceOwner()) {
            return;
        }

        try {
            // Remover restricciones
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_WIFI);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_ADJUST_VOLUME);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_SYSTEM_ERROR_DIALOGS);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_DATE_TIME);
                devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_OUTGOING_CALLS);
            }

            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_INSTALL_APPS);
            devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                devicePolicyManager.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            }

            // Limpiar aplicaciones de Lock Task Mode
            devicePolicyManager.setLockTaskPackages(adminComponent, new String[0]);

        } catch (Exception e) {
            android.util.Log.e("KioskModule", "Error removiendo restricciones: " + e.getMessage());
        }
    }

    /**
     * Activa modo inmersivo completo para ocultar barras del sistema
     */
    private void enableImmersiveMode(Activity activity) {
        try {
            View decorView = activity.getWindow().getDecorView();
            int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            
            decorView.setSystemUiVisibility(uiOptions);

            // Bloquear la barra de notificaciones
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);

        } catch (Exception e) {
            android.util.Log.e("KioskModule", "Error activando modo inmersivo: " + e.getMessage());
        }
    }

    /**
     * Desactiva modo inmersivo
     */
    private void disableImmersiveMode(Activity activity) {
        try {
            View decorView = activity.getWindow().getDecorView();
            decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            
        } catch (Exception e) {
            android.util.Log.e("KioskModule", "Error desactivando modo inmersivo: " + e.getMessage());
        }
    }

    /**
     * Verifica el estado de restricciones del sistema
     */
    @ReactMethod
    public void getSystemRestrictions(Promise promise) {
        try {
            WritableMap restrictions = Arguments.createMap();
            
            restrictions.putBoolean("isDeviceOwner", isDeviceOwner());
            
            if (devicePolicyManager != null) {
                restrictions.putBoolean("wifiConfigBlocked", devicePolicyManager.getUserRestrictions(adminComponent).getBoolean(UserManager.DISALLOW_CONFIG_WIFI, false));
                restrictions.putBoolean("bluetoothConfigBlocked", devicePolicyManager.getUserRestrictions(adminComponent).getBoolean(UserManager.DISALLOW_CONFIG_BLUETOOTH, false));
                restrictions.putBoolean("volumeAdjustBlocked", devicePolicyManager.getUserRestrictions(adminComponent).getBoolean(UserManager.DISALLOW_ADJUST_VOLUME, false));
                restrictions.putBoolean("factoryResetBlocked", devicePolicyManager.getUserRestrictions(adminComponent).getBoolean(UserManager.DISALLOW_FACTORY_RESET, false));
            }
            
            promise.resolve(restrictions);
            
        } catch (Exception e) {
            promise.reject("SYSTEM_ERROR", "Error obteniendo restricciones del sistema: " + e.getMessage(), e);
        }
    }
}
