package com.businesscard.scanner.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.businesscard.scanner.R
import com.businesscard.scanner.data.BusinessCard
import com.businesscard.scanner.databinding.ItemBusinessCardBinding

class BusinessCardAdapter(
    private val onCardClick: (BusinessCard) -> Unit,
    private val onFavoriteClick: (BusinessCard) -> Unit,
    private val onDeleteClick: (BusinessCard) -> Unit
) : ListAdapter<BusinessCard, BusinessCardAdapter.ViewHolder>(DiffCallback()) {

    private val avatarColors = listOf(
        R.color.avatar_blue,
        R.color.avatar_green,
        R.color.avatar_purple,
        R.color.avatar_orange,
        R.color.avatar_teal
    )

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemBusinessCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }

    inner class ViewHolder(private val binding: ItemBusinessCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(card: BusinessCard, position: Int) {
            // 頭像文字和顏色
            val initial = card.name.firstOrNull()?.toString() ?: "?"
            binding.tvAvatar.text = initial
            val colorRes = avatarColors[position % avatarColors.size]
            binding.tvAvatar.setBackgroundResource(R.drawable.bg_avatar_circle)
            binding.tvAvatar.backgroundTintList =
                binding.root.context.getColorStateList(colorRes)

            // 基本資訊
            binding.tvName.text = card.name.ifEmpty { "未知姓名" }
            binding.tvTitle.text = card.title
            binding.tvTitle.visibility = if (card.title.isEmpty()) View.GONE else View.VISIBLE
            binding.tvCompany.text = card.company
            binding.companyLayout.visibility = if (card.company.isEmpty()) View.GONE else View.VISIBLE

            // 聯絡資訊（優先顯示手機，沒有才顯示電話）
            val phoneText = card.mobile.ifEmpty { card.phone }
            binding.tvPhone.text = phoneText
            binding.phoneLayout.visibility = if (phoneText.isEmpty()) View.GONE else View.VISIBLE

            binding.tvEmail.text = card.email
            binding.emailLayout.visibility = if (card.email.isEmpty()) View.GONE else View.VISIBLE

            // 分類和行業標籤
            binding.tvCategory.text = card.category
            binding.tvCategory.visibility = if (card.category.isEmpty()) View.GONE else View.VISIBLE

            binding.tvIndustry.text = card.industry
            binding.tvIndustry.visibility = if (card.industry.isEmpty()) View.GONE else View.VISIBLE

            // 收藏圖示
            binding.btnFavorite.setImageResource(
                if (card.isFavorite) android.R.drawable.btn_star_big_on
                else android.R.drawable.btn_star_big_off
            )

            // 點擊事件
            binding.root.setOnClickListener { onCardClick(card) }
            binding.btnFavorite.setOnClickListener { onFavoriteClick(card) }
            binding.root.setOnLongClickListener {
                onDeleteClick(card)
                true
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<BusinessCard>() {
        override fun areItemsTheSame(oldItem: BusinessCard, newItem: BusinessCard) =
            oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: BusinessCard, newItem: BusinessCard) =
            oldItem == newItem
    }
}
