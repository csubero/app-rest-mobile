package com.arh.apprestmobile

import android.app.Application
import com.arh.apprestmobile.data.local.PreferencesManager

class RestMobileApplication : Application() {
    
    companion object {
        lateinit var instance: RestMobileApplication
            private set
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Initialize PreferencesManager
        PreferencesManager.init(this)
    }
}
