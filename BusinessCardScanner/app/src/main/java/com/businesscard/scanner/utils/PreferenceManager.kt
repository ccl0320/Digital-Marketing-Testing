package com.businesscard.scanner.utils

import android.content.Context
import android.content.SharedPreferences

class PreferenceManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        "business_card_prefs", Context.MODE_PRIVATE
    )

    companion object {
        private const val KEY_API_KEY = "gemini_api_key"
        private const val KEY_DEFAULT_CATEGORY = "default_category"
        private const val KEY_AUTO_FETCH_COMPANY = "auto_fetch_company"
        private const val KEY_SORT_ORDER = "sort_order"
    }

    fun getApiKey(): String = prefs.getString(KEY_API_KEY, "") ?: ""

    fun setApiKey(key: String) = prefs.edit().putString(KEY_API_KEY, key).apply()

    fun getDefaultCategory(): String = prefs.getString(KEY_DEFAULT_CATEGORY, "") ?: ""

    fun setDefaultCategory(cat: String) = prefs.edit().putString(KEY_DEFAULT_CATEGORY, cat).apply()

    fun isAutoFetchCompanyEnabled(): Boolean = prefs.getBoolean(KEY_AUTO_FETCH_COMPANY, true)

    fun setAutoFetchCompany(enabled: Boolean) =
        prefs.edit().putBoolean(KEY_AUTO_FETCH_COMPANY, enabled).apply()

    fun getSortOrder(): String = prefs.getString(KEY_SORT_ORDER, "newest") ?: "newest"

    fun setSortOrder(order: String) = prefs.edit().putString(KEY_SORT_ORDER, order).apply()
}
