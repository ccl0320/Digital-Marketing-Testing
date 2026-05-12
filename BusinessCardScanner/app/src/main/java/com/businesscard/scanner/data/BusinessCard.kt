package com.businesscard.scanner.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "business_cards")
data class BusinessCard(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String = "",
    val title: String = "",
    val company: String = "",
    val email: String = "",
    val phone: String = "",
    val mobile: String = "",
    val website: String = "",
    val address: String = "",
    val linkedin: String = "",
    val industry: String = "",
    val category: String = "",
    val companyDescription: String = "",
    val companyKeyPoints: String = "",
    val imagePath: String = "",
    val rawText: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false,
    val tags: String = ""
)
