package com.businesscard.scanner.viewmodel

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.*
import com.businesscard.scanner.api.GeminiRepository
import com.businesscard.scanner.data.AppDatabase
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.data.BusinessCardRepository
import com.businesscard.scanner.utils.PreferenceManager
import kotlinx.coroutines.launch

sealed class ScanState {
    object Idle : ScanState()
    object Scanning : ScanState()
    object FetchingCompanyInfo : ScanState()
    data class Success(val card: BusinessCard) : ScanState()
    data class Error(val message: String) : ScanState()
}

class ScanViewModel(application: Application) : AndroidViewModel(application) {

    private val dbRepository: BusinessCardRepository
    private val prefManager = PreferenceManager(application)

    private val _scanState = MutableLiveData<ScanState>(ScanState.Idle)
    val scanState: LiveData<ScanState> = _scanState

    private val _capturedBitmap = MutableLiveData<Bitmap?>()
    val capturedBitmap: LiveData<Bitmap?> = _capturedBitmap

    private var currentCard: BusinessCard? = null

    init {
        val db = AppDatabase.getDatabase(application)
        dbRepository = BusinessCardRepository(db.businessCardDao())
    }

    fun setCapturedBitmap(bitmap: Bitmap) {
        _capturedBitmap.value = bitmap
    }

    fun analyzeCard(bitmap: Bitmap) {
        val apiKey = prefManager.getApiKey()
        if (apiKey.isEmpty()) {
            _scanState.value = ScanState.Error("請先在設定中填入 Gemini API Key")
            return
        }

        _scanState.value = ScanState.Scanning
        val geminiRepo = GeminiRepository(apiKey)

        viewModelScope.launch {
            val result = geminiRepo.analyzeBusinessCard(bitmap)
            result.fold(
                onSuccess = { card ->
                    currentCard = card
                    if (card.company.isNotEmpty()) {
                        _scanState.value = ScanState.FetchingCompanyInfo
                        fetchCompanyInfo(card, geminiRepo)
                    } else {
                        _scanState.value = ScanState.Success(card)
                    }
                },
                onFailure = { error ->
                    _scanState.value = ScanState.Error(error.message ?: "分析名片時發生錯誤")
                }
            )
        }
    }

    private suspend fun fetchCompanyInfo(card: BusinessCard, geminiRepo: GeminiRepository) {
        val result = geminiRepo.searchCompanyInfo(card.company, card.industry)
        val updatedCard = result.fold(
            onSuccess = { info ->
                card.copy(
                    companyDescription = info,
                    companyKeyPoints = extractKeyPoints(info)
                )
            },
            onFailure = { card }
        )
        currentCard = updatedCard
        _scanState.value = ScanState.Success(updatedCard)
    }

    private val _savedCardId = MutableLiveData<Long>()
    val savedCardId: LiveData<Long> = _savedCardId

    fun saveCard(card: BusinessCard, imagePath: String = "") {
        viewModelScope.launch {
            val cardToSave = card.copy(imagePath = imagePath)
            val id = dbRepository.insertCard(cardToSave)
            _savedCardId.value = id
            _scanState.value = ScanState.Idle
        }
    }

    fun resetState() {
        _scanState.value = ScanState.Idle
        _capturedBitmap.value = null
        currentCard = null
    }

    private fun extractKeyPoints(text: String): String {
        // 取前3行作為重點
        return text.lines().take(5).joinToString("\n")
    }
}
