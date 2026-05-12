package com.businesscard.scanner.viewmodel

import android.app.Application
import androidx.lifecycle.*
import com.businesscard.scanner.api.GeminiRepository
import com.businesscard.scanner.data.AppDatabase
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.data.BusinessCardRepository
import com.businesscard.scanner.utils.PreferenceManager
import kotlinx.coroutines.launch

class CardDetailViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: BusinessCardRepository
    private val prefManager = PreferenceManager(application)

    private val _card = MutableLiveData<BusinessCard?>()
    val card: LiveData<BusinessCard?> = _card

    private val _isLoadingCompanyInfo = MutableLiveData<Boolean>(false)
    val isLoadingCompanyInfo: LiveData<Boolean> = _isLoadingCompanyInfo

    private val _companyInfo = MutableLiveData<String>()
    val companyInfo: LiveData<String> = _companyInfo

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    init {
        val db = AppDatabase.getDatabase(application)
        repository = BusinessCardRepository(db.businessCardDao())
    }

    fun loadCard(id: Long) = viewModelScope.launch {
        val card = if (id > 0) {
            repository.getCardById(id)
        } else {
            // 載入最新一筆（從掃描頁進來）
            repository.allCards.value?.firstOrNull()
                ?: run {
                    // allCards 可能尚未載入，等待一下後再試
                    kotlinx.coroutines.delay(500)
                    repository.allCards.value?.firstOrNull()
                }
        }
        _card.value = card
        if (!card?.companyDescription.isNullOrEmpty()) {
            _companyInfo.value = card?.companyDescription ?: ""
        }
    }

    fun setCard(card: BusinessCard) {
        _card.value = card
        if (card.companyDescription.isNotEmpty()) {
            _companyInfo.value = card.companyDescription
        }
    }

    fun updateCard(card: BusinessCard) = viewModelScope.launch {
        repository.updateCard(card.copy(updatedAt = System.currentTimeMillis()))
        _card.value = card
    }

    fun deleteCard() = viewModelScope.launch {
        _card.value?.let { repository.deleteCard(it) }
    }

    fun toggleFavorite() = viewModelScope.launch {
        _card.value?.let { card ->
            val updated = card.copy(isFavorite = !card.isFavorite)
            repository.updateCard(updated)
            _card.value = updated
        }
    }

    fun refreshCompanyInfo() {
        val card = _card.value ?: return
        val apiKey = prefManager.getApiKey()
        if (apiKey.isEmpty()) {
            _errorMessage.value = "請先在設定中填入 Gemini API Key"
            return
        }

        _isLoadingCompanyInfo.value = true
        val geminiRepo = GeminiRepository(apiKey)

        viewModelScope.launch {
            val result = geminiRepo.searchCompanyInfo(card.company, card.industry)
            result.fold(
                onSuccess = { info ->
                    _companyInfo.value = info
                    val updatedCard = card.copy(
                        companyDescription = info,
                        updatedAt = System.currentTimeMillis()
                    )
                    repository.updateCard(updatedCard)
                    _card.value = updatedCard
                },
                onFailure = { error ->
                    _errorMessage.value = "無法取得公司資訊: ${error.message}"
                }
            )
            _isLoadingCompanyInfo.value = false
        }
    }
}
