package com.businesscard.scanner.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.businesscard.scanner.R
import com.businesscard.scanner.databinding.ActivityScanBinding
import com.businesscard.scanner.utils.ImageUtils
import com.businesscard.scanner.viewmodel.ScanState
import com.businesscard.scanner.viewmodel.ScanViewModel
import java.io.File
import java.io.InputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScanActivity : AppCompatActivity() {

    private lateinit var binding: ActivityScanBinding
    private val viewModel: ScanViewModel by viewModels()
    private lateinit var cameraExecutor: ExecutorService
    private var imageCapture: ImageCapture? = null
    private var flashEnabled = false
    private var camera: Camera? = null

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startCamera()
        else Toast.makeText(this, R.string.permission_required, Toast.LENGTH_LONG).show()
    }

    private val galleryLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { processImageFromGallery(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()

        setupClickListeners()
        observeViewModel()
        checkCameraPermission()
    }

    private fun checkCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .build()

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageCapture
                )
            } catch (e: Exception) {
                Toast.makeText(this, "無法啟動相機: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun setupClickListeners() {
        binding.btnClose.setOnClickListener { finish() }

        binding.btnCapture.setOnClickListener { capturePhoto() }

        binding.btnGallery.setOnClickListener {
            galleryLauncher.launch("image/*")
        }

        binding.btnFlash.setOnClickListener {
            flashEnabled = !flashEnabled
            camera?.cameraControl?.enableTorch(flashEnabled)
            binding.ivFlash.alpha = if (flashEnabled) 1f else 0.5f
        }
    }

    private fun capturePhoto() {
        val imageCapture = imageCapture ?: return
        val photoFile = File(cacheDir, "card_${System.currentTimeMillis()}.jpg")
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    val bitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                    processCapture(bitmap)
                }

                override fun onError(exc: ImageCaptureException) {
                    Toast.makeText(this@ScanActivity, "拍照失敗: ${exc.message}", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    private fun processImageFromGallery(uri: Uri) {
        try {
            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            processCapture(bitmap)
        } catch (e: Exception) {
            Toast.makeText(this, "無法讀取圖片", Toast.LENGTH_SHORT).show()
        }
    }

    private fun processCapture(bitmap: Bitmap) {
        viewModel.setCapturedBitmap(bitmap)
        viewModel.analyzeCard(bitmap)
    }

    private fun observeViewModel() {
        viewModel.savedCardId.observe(this) { cardId ->
            if (cardId > 0) {
                val intent = Intent(this, CardDetailActivity::class.java).apply {
                    putExtra(CardDetailActivity.EXTRA_CARD_ID, cardId)
                }
                startActivity(intent)
                finish()
            }
        }

        viewModel.scanState.observe(this) { state ->
            when (state) {
                is ScanState.Idle -> {
                    binding.analyzingOverlay.visibility = View.GONE
                }
                is ScanState.Scanning -> {
                    binding.analyzingOverlay.visibility = View.VISIBLE
                    binding.tvAnalyzingStatus.text = getString(R.string.analyzing)
                }
                is ScanState.FetchingCompanyInfo -> {
                    binding.analyzingOverlay.visibility = View.VISIBLE
                    binding.tvAnalyzingStatus.text = getString(R.string.fetching_company)
                }
                is ScanState.Success -> {
                    binding.analyzingOverlay.visibility = View.GONE

                    // 儲存圖片
                    val bitmap = viewModel.capturedBitmap.value
                    val imagePath = if (bitmap != null) {
                        ImageUtils.saveBitmapToFile(this, bitmap)
                    } else ""

                    // 儲存到資料庫，觀察 savedCardId 後跳轉
                    viewModel.saveCard(state.card, imagePath)
                }
                is ScanState.Error -> {
                    binding.analyzingOverlay.visibility = View.GONE
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                    viewModel.resetState()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
