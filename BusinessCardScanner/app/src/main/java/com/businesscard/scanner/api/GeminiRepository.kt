package com.businesscard.scanner.api

import android.graphics.Bitmap
import android.util.Base64
import com.businesscard.scanner.data.BusinessCard
import com.google.gson.Gson
import com.google.gson.JsonObject
import java.io.ByteArrayOutputStream

class GeminiRepository(private val apiKey: String) {

    private val gson = Gson()

    suspend fun analyzeBusinessCard(bitmap: Bitmap): Result<BusinessCard> {
        return try {
            val base64Image = bitmapToBase64(bitmap)

            val prompt = """
                請分析這張名片圖片，提取所有資訊並以JSON格式回傳。

                請嚴格按照以下JSON格式回傳（不要加任何其他文字，只回傳JSON）：
                {
                    "name": "姓名",
                    "title": "職稱",
                    "company": "公司名稱",
                    "email": "電子郵件",
                    "phone": "電話（含區號）",
                    "mobile": "手機號碼",
                    "website": "網站",
                    "address": "地址",
                    "linkedin": "LinkedIn",
                    "industry": "推測的行業類別",
                    "category": "聯絡人分類（如：客戶、供應商、合作夥伴、同業、媒體、其他）",
                    "rawText": "名片上所有原始文字"
                }

                如果某欄位無法從名片中找到，請留空字串。
                industry 請根據公司名稱和職稱推測行業（如：科技、金融、製造、零售、醫療、教育等）。
                category 請根據職稱和公司類型判斷分類。
            """.trimIndent()

            val request = GeminiRequest(
                contents = listOf(
                    Content(
                        parts = listOf(
                            Part(inlineData = InlineData(mimeType = "image/jpeg", data = base64Image)),
                            Part(text = prompt)
                        )
                    )
                )
            )

            val response = GeminiClient.service.generateContent(apiKey, request)

            if (response.isSuccessful) {
                val body = response.body()
                val text = body?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: return Result.failure(Exception("無法解析名片內容"))

                val card = parseCardFromJson(text)
                Result.success(card)
            } else {
                val errorBody = response.errorBody()?.string()
                Result.failure(Exception("API 錯誤: ${response.code()} - $errorBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchCompanyInfo(companyName: String, industry: String): Result<String> {
        return try {
            val prompt = """
                請針對「${companyName}」這家公司提供重點摘要資訊。
                行業別：${industry.ifEmpty { "不明" }}

                請提供以下資訊（以繁體中文回答，約200-300字）：
                1. 公司簡介（業務範疇、規模）
                2. 主要產品或服務
                3. 市場定位與競爭優勢
                4. 近期重要動態或新聞（如有公開資訊）
                5. 與此公司合作/交流的注意事項或建議

                如果是不知名的小公司，請根據公司名稱和行業推測可能的業務範疇，並說明這是推測。
                請以結構清晰的方式呈現，使用適當的段落分隔。
            """.trimIndent()

            val request = GeminiRequest(
                contents = listOf(
                    Content(parts = listOf(Part(text = prompt)))
                ),
                generationConfig = GenerationConfig(temperature = 0.3f, maxOutputTokens = 1024)
            )

            val response = GeminiClient.service.generateContent(apiKey, request)

            if (response.isSuccessful) {
                val text = response.body()?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: return Result.failure(Exception("無法取得公司資訊"))
                Result.success(text)
            } else {
                Result.failure(Exception("API 錯誤: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun parseCardFromJson(jsonText: String): BusinessCard {
        val cleanJson = jsonText
            .replace("```json", "")
            .replace("```", "")
            .trim()

        return try {
            val json = gson.fromJson(cleanJson, JsonObject::class.java)
            BusinessCard(
                name = json.getStringOrEmpty("name"),
                title = json.getStringOrEmpty("title"),
                company = json.getStringOrEmpty("company"),
                email = json.getStringOrEmpty("email"),
                phone = json.getStringOrEmpty("phone"),
                mobile = json.getStringOrEmpty("mobile"),
                website = json.getStringOrEmpty("website"),
                address = json.getStringOrEmpty("address"),
                linkedin = json.getStringOrEmpty("linkedin"),
                industry = json.getStringOrEmpty("industry"),
                category = json.getStringOrEmpty("category"),
                rawText = json.getStringOrEmpty("rawText")
            )
        } catch (e: Exception) {
            BusinessCard(rawText = cleanJson)
        }
    }

    private fun JsonObject.getStringOrEmpty(key: String): String {
        return try {
            get(key)?.asString ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        // 壓縮圖片以節省 API 請求大小
        val scaledBitmap = if (bitmap.width > 1024 || bitmap.height > 1024) {
            val ratio = minOf(1024f / bitmap.width, 1024f / bitmap.height)
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * ratio).toInt(),
                (bitmap.height * ratio).toInt(),
                true
            )
        } else bitmap

        scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }
}
