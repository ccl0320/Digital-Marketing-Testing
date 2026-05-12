package com.businesscard.scanner.ui

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.businesscard.scanner.R
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.databinding.ActivityMainBinding
import com.businesscard.scanner.viewmodel.MainViewModel
import com.google.android.material.chip.Chip

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()
    private lateinit var adapter: BusinessCardAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)

        setupRecyclerView()
        setupSearch()
        setupObservers()
        setupClickListeners()
    }

    private fun setupRecyclerView() {
        adapter = BusinessCardAdapter(
            onCardClick = { card -> openCardDetail(card) },
            onFavoriteClick = { card -> viewModel.toggleFavorite(card) },
            onDeleteClick = { card -> showDeleteDialog(card) }
        )
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            this.adapter = this@MainActivity.adapter
        }
    }

    private fun setupSearch() {
        binding.searchEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                viewModel.setSearchQuery(s?.toString() ?: "")
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupObservers() {
        viewModel.displayedCards.observe(this) { cards ->
            adapter.submitList(cards)
            updateEmptyView(cards.isEmpty())
        }

        viewModel.allCategories.observe(this) { categories ->
            updateCategoryChips(categories)
        }

        viewModel.cardCount.observe(this) { count ->
            supportActionBar?.subtitle = getString(R.string.total_cards, count)
        }
    }

    private fun setupClickListeners() {
        binding.fabScan.setOnClickListener {
            startActivity(Intent(this, ScanActivity::class.java))
        }
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_favorites -> {
                viewModel.toggleShowFavorites()
                true
            }
            R.id.action_settings -> {
                startActivity(Intent(this, SettingsActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun updateCategoryChips(categories: List<String>) {
        binding.categoryChipGroup.removeAllViews()

        // 全部 chip
        addCategoryChip("全部", selected = true)

        // 各分類 chip
        categories.forEach { category ->
            addCategoryChip(category)
        }
    }

    private fun addCategoryChip(text: String, selected: Boolean = false) {
        val chip = Chip(this).apply {
            this.text = text
            isCheckable = true
            isChecked = selected
            setChipBackgroundColorResource(
                if (selected) R.color.primary_blue else android.R.color.transparent
            )
            setTextColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (selected) android.R.color.white else android.R.color.white
                )
            )
            chipStrokeWidth = 1f
            setChipStrokeColorResource(android.R.color.white)

            setOnClickListener {
                val category = if (text == "全部") "" else text
                viewModel.setSelectedCategory(category)

                // 更新所有 chip 樣式
                val group = binding.categoryChipGroup
                for (i in 0 until group.childCount) {
                    val c = group.getChildAt(i) as? Chip ?: continue
                    val isSelected = c == this
                    c.setChipBackgroundColorResource(
                        if (isSelected) R.color.primary_blue else android.R.color.transparent
                    )
                }
            }
        }
        binding.categoryChipGroup.addView(chip)
    }

    private fun updateEmptyView(isEmpty: Boolean) {
        binding.emptyView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.recyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
    }

    private fun openCardDetail(card: BusinessCard) {
        val intent = Intent(this, CardDetailActivity::class.java).apply {
            putExtra(CardDetailActivity.EXTRA_CARD_ID, card.id)
        }
        startActivity(intent)
    }

    private fun showDeleteDialog(card: BusinessCard) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(R.string.delete_confirm)
            .setPositiveButton(R.string.confirm) { _, _ ->
                viewModel.deleteCard(card)
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }
}
