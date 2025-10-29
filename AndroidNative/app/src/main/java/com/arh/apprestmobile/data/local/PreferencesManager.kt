package com.arh.apprestmobile.data.local

import android.content.Context
import android.content.SharedPreferences
import com.arh.apprestmobile.data.models.Company
import com.arh.apprestmobile.data.models.PointOfSale
import com.arh.apprestmobile.data.models.Store
import com.google.gson.Gson

class PreferencesManager private constructor(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()
    
    companion object {
        private const val PREFS_NAME = "AppRestMobilePrefs"
        private const val KEY_SERVER_IP = "server_ip"
        private const val KEY_API_TOKEN = "api_token"
        private const val KEY_COMPANY = "company"
        private const val KEY_STORE = "store"
        private const val KEY_POINT_OF_SALE = "point_of_sale"
        private const val KEY_LANGUAGE = "language"
        
        @Volatile
        private var instance: PreferencesManager? = null
        
        fun init(context: Context) {
            if (instance == null) {
                synchronized(this) {
                    if (instance == null) {
                        instance = PreferencesManager(context.applicationContext)
                    }
                }
            }
        }
        
        fun getInstance(): PreferencesManager {
            return instance ?: throw IllegalStateException("PreferencesManager must be initialized first")
        }
    }
    
    // Server IP
    fun setServerIp(ip: String) {
        prefs.edit().putString(KEY_SERVER_IP, ip).apply()
    }
    
    fun getServerIp(): String? {
        return prefs.getString(KEY_SERVER_IP, null)
    }
    
    // API Token
    fun setApiToken(token: String) {
        prefs.edit().putString(KEY_API_TOKEN, token).apply()
    }
    
    fun getApiToken(): String? {
        return prefs.getString(KEY_API_TOKEN, null)
    }
    
    // Company
    fun setCompany(company: Company) {
        val json = gson.toJson(company)
        prefs.edit().putString(KEY_COMPANY, json).apply()
    }
    
    fun getCompany(): Company? {
        val json = prefs.getString(KEY_COMPANY, null) ?: return null
        return try {
            gson.fromJson(json, Company::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    // Store
    fun setStore(store: Store) {
        val json = gson.toJson(store)
        prefs.edit().putString(KEY_STORE, json).apply()
    }
    
    fun getStore(): Store? {
        val json = prefs.getString(KEY_STORE, null) ?: return null
        return try {
            gson.fromJson(json, Store::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    // Point of Sale
    fun setPointOfSale(pointOfSale: PointOfSale) {
        val json = gson.toJson(pointOfSale)
        prefs.edit().putString(KEY_POINT_OF_SALE, json).apply()
    }
    
    fun getPointOfSale(): PointOfSale? {
        val json = prefs.getString(KEY_POINT_OF_SALE, null) ?: return null
        return try {
            gson.fromJson(json, PointOfSale::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    // Language
    fun setLanguage(language: String) {
        prefs.edit().putString(KEY_LANGUAGE, language).apply()
    }
    
    fun getLanguage(): String {
        return prefs.getString(KEY_LANGUAGE, "es") ?: "es"
    }
    
    // Clear all data
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
