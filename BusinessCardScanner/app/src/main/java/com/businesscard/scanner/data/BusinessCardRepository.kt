package com.businesscard.scanner.data

import androidx.lifecycle.LiveData

class BusinessCardRepository(private val dao: BusinessCardDao) {

    val allCards: LiveData<List<BusinessCard>> = dao.getAllCards()
    val cardCount: LiveData<Int> = dao.getCardCount()
    val allCategories: LiveData<List<String>> = dao.getAllCategories()

    suspend fun getCardById(id: Long): BusinessCard? = dao.getCardById(id)

    fun searchCards(query: String): LiveData<List<BusinessCard>> = dao.searchCards(query)

    fun getCardsByCategory(category: String): LiveData<List<BusinessCard>> =
        dao.getCardsByCategory(category)

    fun getFavoriteCards(): LiveData<List<BusinessCard>> = dao.getFavoriteCards()

    suspend fun insertCard(card: BusinessCard): Long = dao.insertCard(card)

    suspend fun updateCard(card: BusinessCard) = dao.updateCard(card)

    suspend fun deleteCard(card: BusinessCard) = dao.deleteCard(card)

    suspend fun deleteCardById(id: Long) = dao.deleteCardById(id)

    suspend fun toggleFavorite(card: BusinessCard) {
        dao.updateCard(card.copy(isFavorite = !card.isFavorite))
    }
}
