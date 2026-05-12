package com.businesscard.scanner.viewmodel

import android.app.Application
import androidx.lifecycle.*
import com.businesscard.scanner.data.AppDatabase
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.data.BusinessCardRepository
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: BusinessCardRepository

    val allCards: LiveData<List<BusinessCard>>
    val cardCount: LiveData<Int>
    val allCategories: LiveData<List<String>>

    private val _searchQuery = MutableLiveData<String>("")
    private val _selectedCategory = MutableLiveData<String>("")
    private val _showFavorites = MutableLiveData<Boolean>(false)

    val displayedCards: LiveData<List<BusinessCard>> = MediatorLiveData<List<BusinessCard>>().apply {
        var currentCards: List<BusinessCard> = emptyList()
        var currentQuery: String = ""
        var currentCategory: String = ""
        var showFavs: Boolean = false

        fun update() {
            value = currentCards.filter { card ->
                val matchesQuery = currentQuery.isEmpty() ||
                        card.name.contains(currentQuery, ignoreCase = true) ||
                        card.company.contains(currentQuery, ignoreCase = true) ||
                        card.email.contains(currentQuery, ignoreCase = true) ||
                        card.phone.contains(currentQuery, ignoreCase = true) ||
                        card.industry.contains(currentQuery, ignoreCase = true) ||
                        card.tags.contains(currentQuery, ignoreCase = true)
                val matchesCategory = currentCategory.isEmpty() || card.category == currentCategory
                val matchesFavorite = !showFavs || card.isFavorite
                matchesQuery && matchesCategory && matchesFavorite
            }
        }

        addSource(allCards) { cards ->
            currentCards = cards ?: emptyList()
            update()
        }
        addSource(_searchQuery) { query ->
            currentQuery = query ?: ""
            update()
        }
        addSource(_selectedCategory) { cat ->
            currentCategory = cat ?: ""
            update()
        }
        addSource(_showFavorites) { favs ->
            showFavs = favs ?: false
            update()
        }
    }

    init {
        val db = AppDatabase.getDatabase(application)
        repository = BusinessCardRepository(db.businessCardDao())
        allCards = repository.allCards
        cardCount = repository.cardCount
        allCategories = repository.allCategories
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedCategory(category: String) {
        _selectedCategory.value = category
    }

    fun toggleShowFavorites() {
        _showFavorites.value = !(_showFavorites.value ?: false)
    }

    fun deleteCard(card: BusinessCard) = viewModelScope.launch {
        repository.deleteCard(card)
    }

    fun toggleFavorite(card: BusinessCard) = viewModelScope.launch {
        repository.toggleFavorite(card)
    }
}
