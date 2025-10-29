package com.arh.apprestmobile;

import android.media.ToneGenerator;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.media.Ringtone;
import android.net.Uri;
import android.content.Context;
import android.os.Handler;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SystemSoundModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private ToneGenerator toneGenerator;
    private static final int MAX_VOLUME = 100; // Volumen siempre al máximo

    public SystemSoundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        try {
            // Siempre inicializar con volumen máximo
            this.toneGenerator = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, MAX_VOLUME);
        } catch (RuntimeException e) {
            // ToneGenerator creation failed, will use fallback
            this.toneGenerator = null;
        }
    }

    @Override
    public String getName() {
        return "SystemSoundModule";
    }

    @ReactMethod
    public void playTone(int toneType, int durationMs) {
        if (toneGenerator != null) {
            try {
                toneGenerator.startTone(toneType, durationMs);
            } catch (Exception e) {
                // Fallback to system notification
                playDefaultNotification();
            }
        } else {
            // Fallback to system notification
            playDefaultNotification();
        }
    }

    @ReactMethod
    public void playDefaultNotification() {
        try {
            Context context = reactContext.getApplicationContext();
            Uri notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Ringtone ringtone = RingtoneManager.getRingtone(context, notificationUri);
            if (ringtone != null) {
                ringtone.play();
            }
        } catch (Exception e) {
            // Silent fail
        }
    }

    @ReactMethod
    public void playSystemSound(int soundId) {
        // This method can be extended for specific system sounds
        playDefaultNotification();
    }

    @ReactMethod
    public void playHighVolumeNotification() {
        try {
            Context context = reactContext.getApplicationContext();
            
            // Obtener el AudioManager para configurar el volumen
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                // Obtener el volumen máximo del stream de notificaciones
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_NOTIFICATION);
                // Configurar al volumen máximo temporalmente
                int currentSystemVolume = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION);
                audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, maxVolume, 0);
                
                // Reproducir la notificación
                Uri notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                Ringtone ringtone = RingtoneManager.getRingtone(context, notificationUri);
                if (ringtone != null) {
                    ringtone.play();
                }
                
                // Restaurar el volumen original después de un pequeño delay
                new android.os.Handler().postDelayed(() -> {
                    audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, currentSystemVolume, 0);
                }, 1000);
            }
        } catch (Exception e) {
            // Fallback to normal notification
            playDefaultNotification();
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        if (toneGenerator != null) {
            toneGenerator.release();
            toneGenerator = null;
        }
        super.onCatalystInstanceDestroy();
    }
}
