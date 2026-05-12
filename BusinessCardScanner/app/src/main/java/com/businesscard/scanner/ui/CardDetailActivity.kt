package com.businesscard.scanner.ui

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.MenuItem
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.businesscard.scanner.R
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.databinding.ActivityCardDetailBinding
import com.businesscard.scanner.viewmodel.CardDetailViewModel
import kotlinx.coroutines.launch

class CardDetailActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_CARD_ID = "extra_card_id"
        const val EXTRA_FROM_SCAN = "extra_from_scan"
    }

    private lateinit var binding: ActivityCardDetailBinding
    private val viewModel: CardDetailViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCardDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        val cardId = intent.getLongExtra(EXTRA_CARD_ID, -1L)
        val fromScan = intent.getBooleanExtra(EXTRA_FROM_SCAN, false)

        if (cardId > 0) {
            viewModel.loadCard(cardId)
        } else if (fromScan) {
            // 從掃描頁來，載入最新一筆
            viewModel.loadCard(-1L)
        }

        setupObservers()
        setupClickListeners()
    }

    private fun setupObservers() {
        viewModel.card.observe(this) { card ->
            card ?: return@observe
            bindCard(card)
        }

        viewModel.isLoadingCompanyInfo.observe(this) { loading ->
            binding.progressCompanyInfo.visibility = if (loading) View.VISIBLE else View.GONE
            binding.tvCompanyInfo.visibility = if (loading) View.GONE else View.VISIBLE
            binding.btnRefreshCompanyInfo.isEnabled = !loading
        }

        viewModel.companyInfo.observe(this) { info ->
            binding.tvCompanyInfo.text = info
        }

        viewModel.errorMessage.observe(this) { msg ->
            msg?.let {
                Toast.makeText(this, it, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun bindCard(card: BusinessCard) {
        supportActionBar?.title = card.name.ifEmpty { "名片詳情" }

        binding.tvName.text = card.name.ifEmpty { "未知姓名" }
        binding.tvTitle.text = card.title
        binding.tvTitle.visibility = if (card.title.isEmpty()) View.GONE else View.VISIBLE
        binding.tvCompany.text = card.company
        binding.tvCompany.visibility = if (card.company.isEmpty()) View.GONE else View.VISIBLE

        binding.tvPhone.text = card.phone
        binding.phoneLayout.visibility = if (card.phone.isEmpty()) View.GONE else View.VISIBLE

        binding.tvMobile.text = card.mobile
        binding.mobileLayout.visibility = if (card.mobile.isEmpty()) View.GONE else View.VISIBLE

        binding.tvEmail.text = card.email
        binding.emailLayout.visibility = if (card.email.isEmpty()) View.GONE else View.VISIBLE

        binding.tvWebsite.text = card.website
        binding.websiteLayout.visibility = if (card.website.isEmpty()) View.GONE else View.VISIBLE

        binding.tvAddress.text = card.address
        binding.addressLayout.visibility = if (card.address.isEmpty()) View.GONE else View.VISIBLE

        binding.tvCategory.text = card.category
        binding.tvCategory.visibility = if (card.category.isEmpty()) View.GONE else View.VISIBLE

        binding.tvIndustry.text = card.industry
        binding.tvIndustry.visibility = if (card.industry.isEmpty()) View.GONE else View.VISIBLE

        binding.etTags.setText(card.tags)

        // 收藏圖示
        binding.btnFavorite.setImageResource(
            if (card.isFavorite) android.R.drawable.btn_star_big_on
            else android.R.drawable.btn_star_big_off
        )

        // 名片圖片
        if (card.imagePath.isNotEmpty()) {
            try {
                val bitmap = BitmapFactory.decodeFile(card.imagePath)
                if (bitmap != null) {
                    binding.ivCardImage.setImageBitmap(bitmap)
                    binding.cardImage.visibility = View.VISIBLE
                }
            } catch (e: Exception) {
                binding.cardImage.visibility = View.GONE
            }
        } else {
            binding.cardImage.visibility = View.GONE
        }

        // 公司資訊
        if (card.companyDescription.isEmpty()) {
            binding.tvCompanyInfo.text = getString(R.string.no_company_info)
        }
    }

    private fun setupClickListeners() {
        binding.btnFavorite.setOnClickListener {
            viewModel.toggleFavorite()
        }

        binding.btnRefreshCompanyInfo.setOnClickListener {
            viewModel.refreshCompanyInfo()
        }

        binding.fabSave.setOnClickListener {
            saveCard()
        }

        // 點擊 Email 開啟郵件
        binding.tvEmail.setOnClickListener {
            val email = binding.tvEmail.text.toString()
            if (email.isNotEmpty()) {
                startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email")))
            }
        }

        // 點擊電話撥打
        binding.tvPhone.setOnClickListener {
            val phone = binding.tvPhone.text.toString()
            if (phone.isNotEmpty()) {
                startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
            }
        }

        binding.tvMobile.setOnClickListener {
            val mobile = binding.tvMobile.text.toString()
            if (mobile.isNotEmpty()) {
                startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$mobile")))
            }
        }

        // 點擊網站開啟瀏覽器
        binding.tvWebsite.setOnClickListener {
            val url = binding.tvWebsite.text.toString()
            if (url.isNotEmpty()) {
                val fullUrl = if (url.startsWith("http")) url else "https://$url"
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl)))
            }
        }
    }

    private fun saveCard() {
        val card = viewModel.card.value ?: return
        val updatedCard = card.copy(
            tags = binding.etTags.text?.toString() ?: "",
            updatedAt = System.currentTimeMillis()
        )
        viewModel.updateCard(updatedCard)
        Toast.makeText(this, R.string.saved_success, Toast.LENGTH_SHORT).show()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                onBackPressedDispatcher.onBackPressed()
                true
            }
            R.id.action_share -> {
                shareCard()
                true
            }
            R.id.action_delete -> {
                showDeleteDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun shareCard() {
        val card = viewModel.card.value ?: return
        val shareText = buildString {
            append("📇 ${card.name}\n")
            if (card.title.isNotEmpty()) append("💼 ${card.title}\n")
            if (card.company.isNotEmpty()) append("🏢 ${card.company}\n")
            if (card.phone.isNotEmpty()) append("📞 ${card.phone}\n")
            if (card.mobile.isNotEmpty()) append("📱 ${card.mobile}\n")
            if (card.email.isNotEmpty()) append("✉️ ${card.email}\n")
            if (card.website.isNotEmpty()) append("🌐 ${card.website}\n")
            if (card.address.isNotEmpty()) append("📍 ${card.address}\n")
        }
        startActivity(Intent.createChooser(
            Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, shareText)
            }, "分享名片"
        ))
    }

    private fun showDeleteDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.delete_confirm)
            .setPositiveButton(R.string.confirm) { _, _ ->
                viewModel.deleteCard()
                Toast.makeText(this, R.string.deleted_success, Toast.LENGTH_SHORT).show()
                finish()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }
}
