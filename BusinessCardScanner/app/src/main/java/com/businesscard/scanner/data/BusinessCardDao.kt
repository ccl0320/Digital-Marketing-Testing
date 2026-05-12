package com.businesscard.scanner.data

import androidx.lifecycle.LiveData
import androidx.room.*

@Dao
interface BusinessCardDao {

    @Query("SELECT * FROM business_cards ORDER BY createdAt DESC")
    fun getAllCards(): LiveData<List<BusinessCard>>

    @Query("SELECT * FROM business_cards WHERE id = :id")
    suspend fun getCardById(id: Long): BusinessCard?

    @Query("""
        SELECT * FROM business_cards
        WHERE name LIKE '%' || :query || '%'
        OR company LIKE '%' || :query || '%'
        OR email LIKE '%' || :query || '%'
        OR phone LIKE '%' || :query || '%'
        OR industry LIKE '%' || :query || '%'
        OR tags LIKE '%' || :query || '%'
        ORDER BY createdAt DESC
    """)
    fun searchCards(query: String): LiveData<List<BusinessCard>>

    @Query("SELECT * FROM business_cards WHERE category = :category ORDER BY createdAt DESC")
    fun getCardsByCategory(category: String): LiveData<List<BusinessCard>>

    @Query("SELECT * FROM business_cards WHERE isFavorite = 1 ORDER BY createdAt DESC")
    fun getFavoriteCards(): LiveData<List<BusinessCard>>

    @Query("SELECT DISTINCT category FROM business_cards WHERE category != '' ORDER BY category")
    fun getAllCategories(): LiveData<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCard(card: BusinessCard): Long

    @Update
    suspend fun updateCard(card: BusinessCard)

    @Delete
    suspend fun deleteCard(card: BusinessCard)

    @Query("DELETE FROM business_cards WHERE id = :id")
    suspend fun deleteCardById(id: Long)

    @Query("SELECT COUNT(*) FROM business_cards")
    fun getCardCount(): LiveData<Int>
}
