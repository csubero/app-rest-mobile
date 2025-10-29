package com.arh.apprestmobile.ui.sync

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.arh.apprestmobile.data.local.PreferencesManager
import com.arh.apprestmobile.databinding.ActivitySyncDataBinding
import com.arh.apprestmobile.network.ApiClient
import com.arh.apprestmobile.ui.language.LanguageSelectionActivity
import kotlinx.coroutines.launch

class SyncDataActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySyncDataBinding
    private val prefs by lazy { PreferencesManager.getInstance() }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySyncDataBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        startSynchronization()
    }
    
    private fun startSynchronization() {
        lifecycleScope.launch {
            try {
                val company = prefs.getCompany()!!
                val store = prefs.getStore()!!
                val pos = prefs.getPointOfSale()!!
                
                // Sync company info
                updateMessage("Sincronizando información de la empresa...")
                val companyResponse = ApiClient.getApiService().getCompanyDetail(company.id)
                if (companyResponse.isSuccessful && companyResponse.body() != null) {
                    prefs.setCompany(companyResponse.body()!!)
                }
                
                // Sync store info
                updateMessage("Sincronizando información de la tienda...")
                val storeResponse = ApiClient.getApiService().getStoreDetail(store.id)
                if (storeResponse.isSuccessful && storeResponse.body() != null) {
                    prefs.setStore(storeResponse.body()!!)
                }
                
                // Sync POS info
                updateMessage("Sincronizando información del punto de venta...")
                val posResponse = ApiClient.getApiService().getPointOfSaleDetail(pos.id)
                if (posResponse.isSuccessful && posResponse.body() != null) {
                    prefs.setPointOfSale(posResponse.body()!!)
                }
                
                // Sync products
                updateMessage("Sincronizando productos...")
                val productsResponse = ApiClient.getApiService().getProducts()
                if (productsResponse.isSuccessful) {
                    // Store products in local database or cache
                    // TODO: Implement product caching
                }
                
                // Sync banner
                updateMessage("Sincronizando banners promocionales...")
                val bannerResponse = ApiClient.getApiService().getBanner()
                if (bannerResponse.isSuccessful) {
                    // Store banner image
                    // TODO: Implement banner caching
                }
                
                updateMessage("Datos sincronizados")
                
                // Navigate to language selection
                val intent = Intent(this@SyncDataActivity, LanguageSelectionActivity::class.java)
                startActivity(intent)
                finish()
                
            } catch (e: Exception) {
                updateMessage("Error al sincronizar datos: ${e.message}")
            }
        }
    }
    
    private fun updateMessage(message: String) {
        binding.tvSyncMessage.text = message
    }
}
