package com.arh.apprestmobile.ui.language

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.arh.apprestmobile.data.local.PreferencesManager
import com.arh.apprestmobile.databinding.ActivityLanguageSelectionBinding
import com.arh.apprestmobile.ui.table.TableConfigActivity

class LanguageSelectionActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLanguageSelectionBinding
    private val prefs by lazy { PreferencesManager.getInstance() }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLanguageSelectionBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
    }
    
    private fun setupViews() {
        binding.btnSpanish.setOnClickListener {
            selectLanguage("es")
        }
        
        binding.btnEnglish.setOnClickListener {
            selectLanguage("en")
        }
    }
    
    private fun selectLanguage(language: String) {
        prefs.setLanguage(language)
        
        // Navigate to table configuration
        val intent = Intent(this, TableConfigActivity::class.java)
        startActivity(intent)
    }
}
