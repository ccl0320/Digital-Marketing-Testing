package com.businesscard.scanner.ui

import android.os.Bundle
import android.view.MenuItem
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.businesscard.scanner.R
import com.businesscard.scanner.api.GeminiClient
import com.businesscard.scanner.api.GeminiRequest
import com.businesscard.scanner.api.Content
import com.businesscard.scanner.api.Part
import com.businesscard.scanner.databinding.ActivitySettingsBinding
import com.businesscard.scanner.utils.PreferenceManager
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefManager: PreferenceManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        prefManager = PreferenceManager(this)

        // 載入已存的 API key
        val savedKey = prefManager.getApiKey()
        if (savedKey.isNotEmpty()) {
            binding.etApiKey.setText(savedKey)
        }

        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.btnSaveApiKey.setOnClickListener {
            val key = binding.etApiKey.text?.toString()?.trim() ?: ""
            if (key.isEmpty()) {
                Toast.makeText(this, "請輸入 API Key", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            prefManager.setApiKey(key)
            Toast.makeText(this, R.string.api_key_saved, Toast.LENGTH_SHORT).show()
        }

        binding.btnTestApiKey.setOnClickListener {
            val key = binding.etApiKey.text?.toString()?.trim() ?: ""
            if (key.isEmpty()) {
                Toast.makeText(this, "請先輸入 API Key", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            testApiKey(key)
        }
    }

    private fun testApiKey(apiKey: String) {
        binding.tvApiStatus.visibility = View.GONE
        binding.btnTestApiKey.isEnabled = false
        binding.btnTestApiKey.text = "測試中..."

        lifecycleScope.launch {
            try {
                val request = GeminiRequest(
                    contents = listOf(
                        Content(parts = listOf(Part(text = "Hello, respond with 'OK'")))
                    )
                )
                val response = GeminiClient.service.generateContent(apiKey, request)

                if (response.isSuccessful) {
                    binding.tvApiStatus.text = getString(R.string.api_test_success)
                    binding.tvApiStatus.setTextColor(getColor(R.color.accent_green))
                } else {
                    binding.tvApiStatus.text = getString(R.string.api_test_fail)
                    binding.tvApiStatus.setTextColor(getColor(android.R.color.holo_red_dark))
                }
            } catch (e: Exception) {
                binding.tvApiStatus.text = "${getString(R.string.api_test_fail)}\n${e.message}"
                binding.tvApiStatus.setTextColor(getColor(android.R.color.holo_red_dark))
            }

            binding.tvApiStatus.visibility = View.VISIBLE
            binding.btnTestApiKey.isEnabled = true
            binding.btnTestApiKey.text = getString(R.string.test_api_key)
        }
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == android.R.id.home) {
            onBackPressedDispatcher.onBackPressed()
            return true
        }
        return super.onOptionsItemSelected(item)
    }
}
