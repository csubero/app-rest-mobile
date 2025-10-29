package com.arh.apprestmobile.ui.table

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.arh.apprestmobile.R
import com.arh.apprestmobile.data.local.PreferencesManager
import com.arh.apprestmobile.data.models.Room
import com.arh.apprestmobile.data.models.Table
import com.arh.apprestmobile.databinding.ActivityTableConfigBinding
import com.arh.apprestmobile.network.ApiClient
import com.arh.apprestmobile.ui.main.MainActivity
import kotlinx.coroutines.launch

class TableConfigActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityTableConfigBinding
    private val prefs by lazy { PreferencesManager.getInstance() }
    
    private var rooms: List<Room> = emptyList()
    private var selectedRoom: Room? = null
    private var selectedTable: Table? = null
    private var numberOfDiners: Int = 0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTableConfigBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        fetchRooms()
    }
    
    private fun setupViews() {
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        binding.btnContinue.setOnClickListener {
            if (validateInputs()) {
                createOrder()
            }
        }
    }
    
    private fun fetchRooms() {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.getApiService().getTables()
                
                if (response.isSuccessful && response.body() != null) {
                    rooms = response.body()!!.filter { it.name.isNotEmpty() }
                    setupRoomSpinner()
                    showLoading(false)
                } else {
                    showLoading(false)
                    Toast.makeText(this@TableConfigActivity, 
                        "Error: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@TableConfigActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupRoomSpinner() {
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            rooms.map { it.name }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerRoom.adapter = adapter
        
        binding.spinnerRoom.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedRoom = rooms[position]
                setupTableSpinner()
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun setupTableSpinner() {
        val tables = selectedRoom?.tables?.filter { it.available && it.activeOrderId == null } ?: emptyList()
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            tables.map { "Mesa ${it.number}" }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerTable.adapter = adapter
        binding.spinnerTable.visibility = View.VISIBLE
        binding.tvTableLabel.visibility = View.VISIBLE
        
        binding.spinnerTable.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedTable = tables[position]
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun validateInputs(): Boolean {
        if (selectedRoom == null) {
            Toast.makeText(this, R.string.error_select_room, Toast.LENGTH_SHORT).show()
            return false
        }
        
        if (selectedTable == null) {
            Toast.makeText(this, R.string.error_select_table, Toast.LENGTH_SHORT).show()
            return false
        }
        
        val dinersText = binding.etNumberOfDiners.text.toString()
        if (dinersText.isEmpty()) {
            Toast.makeText(this, R.string.error_enter_diners, Toast.LENGTH_SHORT).show()
            return false
        }
        
        numberOfDiners = dinersText.toIntOrNull() ?: 0
        if (numberOfDiners <= 0 || numberOfDiners > 20) {
            Toast.makeText(this, "Número de comensales debe estar entre 1 y 20", Toast.LENGTH_SHORT).show()
            return false
        }
        
        return true
    }
    
    private fun createOrder() {
        showLoading(true)
        
        // TODO: Implement order creation via API
        // For now, just navigate to main activity
        
        lifecycleScope.launch {
            try {
                // Simulate order creation delay
                kotlinx.coroutines.delay(1000)
                
                showLoading(false)
                
                // Navigate to main activity (products screen)
                val intent = Intent(this@TableConfigActivity, MainActivity::class.java)
                intent.putExtra("room_id", selectedRoom!!.id)
                intent.putExtra("table_id", selectedTable!!.id)
                intent.putExtra("number_of_diners", numberOfDiners)
                startActivity(intent)
                
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@TableConfigActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnContinue.isEnabled = !show
        binding.btnBack.isEnabled = !show
    }
}
