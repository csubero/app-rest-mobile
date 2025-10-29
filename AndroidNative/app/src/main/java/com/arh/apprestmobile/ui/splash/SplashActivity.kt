package com.arh.apprestmobile.ui.splash

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.arh.apprestmobile.data.local.PreferencesManager
import com.arh.apprestmobile.databinding.ActivitySplashBinding
import com.arh.apprestmobile.ui.config.InitialConfigActivity
import com.arh.apprestmobile.ui.language.LanguageSelectionActivity

class SplashActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySplashBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Check if app is configured
        Handler(Looper.getMainLooper()).postDelayed({
            checkConfiguration()
        }, 2000) // 2 seconds splash delay
    }
    
    private fun checkConfiguration() {
        val prefs = PreferencesManager.getInstance()
        val serverIp = prefs.getServerIp()
        val apiToken = prefs.getApiToken()
        val company = prefs.getCompany()
        val store = prefs.getStore()
        val pos = prefs.getPointOfSale()
        
        val intent = if (serverIp != null && apiToken != null && company != null && 
                         store != null && pos != null) {
            // Already configured, go to language selection
            Intent(this, LanguageSelectionActivity::class.java)
        } else {
            // Not configured, go to initial config
            Intent(this, InitialConfigActivity::class.java)
        }
        
        startActivity(intent)
        finish()
    }
}
