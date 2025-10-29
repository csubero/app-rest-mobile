package com.arh.apprestmobile.network

import com.arh.apprestmobile.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/token/")
    suspend fun getToken(
        @Body credentials: Map<String, String>
    ): Response<TokenResponse>
    
    @GET("companies/list/")
    suspend fun getCompanies(): Response<List<Company>>
    
    @GET("companies/{id}/detail/")
    suspend fun getCompanyDetail(
        @Path("id") companyId: Int
    ): Response<Company>
    
    @GET("stores/{id}/detail/")
    suspend fun getStoreDetail(
        @Path("id") storeId: Int
    ): Response<Store>
    
    @GET("point-of-sales/{id}/detail/")
    suspend fun getPointOfSaleDetail(
        @Path("id") posId: Int
    ): Response<PointOfSale>
    
    @POST("point-of-sales/set-availability/")
    suspend fun setPointOfSaleAvailability(
        @Body data: Map<String, Any>
    ): Response<Any>
    
    @GET("products/actives/")
    suspend fun getProducts(): Response<List<Product>>
    
    @GET("tables/list/")
    suspend fun getTables(): Response<List<Room>>
    
    @GET("cms/banner/")
    suspend fun getBanner(): Response<Map<String, String>>
}
