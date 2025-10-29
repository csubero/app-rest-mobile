package com.arh.apprestmobile.data.models

import com.google.gson.annotations.SerializedName

data class Company(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("stores")
    val stores: List<Store>?
)

data class Store(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("point_of_sales")
    val pointOfSales: List<PointOfSale>?
)

data class PointOfSale(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String
)

data class Room(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("tables")
    val tables: List<Table>?
)

data class Table(
    @SerializedName("id")
    val id: Int,
    @SerializedName("number")
    val number: Int,
    @SerializedName("available")
    val available: Boolean,
    @SerializedName("active_order_id")
    val activeOrderId: Int?
)

data class TokenResponse(
    @SerializedName("access")
    val access: String,
    @SerializedName("refresh")
    val refresh: String?
)

data class Product(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("price")
    val price: Double,
    @SerializedName("image_url")
    val imageUrl: String?
)

data class Menu(
    @SerializedName("id")
    val id: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("image")
    val image: String?,
    @SerializedName("products")
    val products: List<Product>?
)
