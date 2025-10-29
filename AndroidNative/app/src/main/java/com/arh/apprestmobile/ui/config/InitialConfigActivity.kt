package com.arh.apprestmobile.ui.config

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.arh.apprestmobile.R
import com.arh.apprestmobile.data.local.PreferencesManager
import com.arh.apprestmobile.data.models.Company
import com.arh.apprestmobile.data.models.PointOfSale
import com.arh.apprestmobile.data.models.Store
import com.arh.apprestmobile.databinding.ActivityInitialConfigBinding
import com.arh.apprestmobile.network.ApiClient
import com.arh.apprestmobile.ui.sync.SyncDataActivity
import kotlinx.coroutines.launch

class InitialConfigActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityInitialConfigBinding
    private val prefs by lazy { PreferencesManager.getInstance() }
    
    private var companies: List<Company> = emptyList()
    private var selectedCompany: Company? = null
    private var selectedStore: Store? = null
    private var selectedPos: PointOfSale? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityInitialConfigBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        loadSavedIP()
    }
    
    private fun setupViews() {
        binding.btnContinue.setOnClickListener {
            val ip = binding.etServerIp.text.toString().trim()
            if (validateIP(ip)) {
                fetchToken(ip)
            } else {
                Toast.makeText(this, R.string.error_invalid_ip, Toast.LENGTH_SHORT).show()
            }
        }
        
        binding.btnConfirm.setOnClickListener {
            confirmConfiguration()
        }
    }
    
    private fun loadSavedIP() {
        val savedIP = prefs.getServerIp()
        if (!savedIP.isNullOrEmpty()) {
            binding.etServerIp.setText(savedIP)
        }
    }
    
    private fun validateIP(ip: String): Boolean {
        if (ip.isEmpty()) return false
        
        // Accept IP with optional port (e.g., 192.168.1.1 or 192.168.1.1:83)
        val ipPattern = """^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?$""".toRegex()
        return ipPattern.matches(ip)
    }
    
    private fun fetchToken(serverIp: String) {
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                // Configure API client without token first
                ApiClient.configure(serverIp)
                
                val credentials = mapOf(
                    "username" to "kioskapi",
                    "password" to "kiosk2024"
                )
                
                val response = ApiClient.getApiService().getToken(credentials)
                
                if (response.isSuccessful && response.body() != null) {
                    val token = response.body()!!.access
                    prefs.setServerIp(serverIp)
                    prefs.setApiToken(token)
                    
                    // Reconfigure API client with token
                    ApiClient.configure(serverIp, token)
                    
                    fetchCompanies()
                } else {
                    showLoading(false)
                    Toast.makeText(this@InitialConfigActivity, 
                        "Error: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@InitialConfigActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun fetchCompanies() {
        lifecycleScope.launch {
            try {
                val response = ApiClient.getApiService().getCompanies()
                
                if (response.isSuccessful && response.body() != null) {
                    companies = response.body()!!
                    setupCompanySpinner()
                    showLoading(false)
                    showCompanySelection(true)
                } else {
                    showLoading(false)
                    Toast.makeText(this@InitialConfigActivity, 
                        "Error: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@InitialConfigActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupCompanySpinner() {
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            companies.map { it.name }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerCompany.adapter = adapter
        
        binding.spinnerCompany.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedCompany = companies[position]
                setupStoreSpinner()
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun setupStoreSpinner() {
        val stores = selectedCompany?.stores ?: emptyList()
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            stores.map { it.name }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerStore.adapter = adapter
        binding.spinnerStore.visibility = View.VISIBLE
        binding.tvStoreLabel.visibility = View.VISIBLE
        
        binding.spinnerStore.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedStore = stores[position]
                setupPosSpinner()
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun setupPosSpinner() {
        val pointOfSales = selectedStore?.pointOfSales ?: emptyList()
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            pointOfSales.map { it.name }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerPos.adapter = adapter
        binding.spinnerPos.visibility = View.VISIBLE
        binding.tvPosLabel.visibility = View.VISIBLE
        
        binding.spinnerPos.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedPos = pointOfSales[position]
                binding.btnConfirm.visibility = View.VISIBLE
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun confirmConfiguration() {
        if (selectedCompany == null || selectedStore == null || selectedPos == null) {
            Toast.makeText(this, "Por favor complete la configuración", Toast.LENGTH_SHORT).show()
            return
        }
        
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                // Set POS availability
                val data = mapOf(
                    "point_of_sale_id" to selectedPos!!.id,
                    "is_available" to false
                )
                
                ApiClient.getApiService().setPointOfSaleAvailability(data)
                
                // Save configuration
                prefs.setCompany(selectedCompany!!)
                prefs.setStore(selectedStore!!)
                prefs.setPointOfSale(selectedPos!!)
                
                showLoading(false)
                
                // Navigate to sync activity
                val intent = Intent(this@InitialConfigActivity, SyncDataActivity::class.java)
                startActivity(intent)
                finish()
                
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@InitialConfigActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnContinue.isEnabled = !show
        binding.btnConfirm.isEnabled = !show
    }
    
    private fun showCompanySelection(show: Boolean) {
        val visibility = if (show) View.VISIBLE else View.GONE
        binding.tvCompanyLabel.visibility = visibility
        binding.spinnerCompany.visibility = visibility
        binding.layoutServerIp.visibility = if (show) View.GONE else View.VISIBLE
        binding.btnContinue.visibility = if (show) View.GONE else View.VISIBLE
    }
}
