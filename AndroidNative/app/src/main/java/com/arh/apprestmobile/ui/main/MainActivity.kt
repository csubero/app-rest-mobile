package com.arh.apprestmobile.ui.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.arh.apprestmobile.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Get table configuration from intent
        val roomId = intent.getIntExtra("room_id", 0)
        val tableId = intent.getIntExtra("table_id", 0)
        val numberOfDiners = intent.getIntExtra("number_of_diners", 0)
        
        binding.tvInfo.text = "Mesa configurada\nSala ID: $roomId\nMesa ID: $tableId\nComensales: $numberOfDiners"
    }
}
