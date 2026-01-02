package com.stardewvoice

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.textview.MaterialTextView

class MainActivity : AppCompatActivity() {
    private lateinit var bundleManager: BundleManager
    private lateinit var voiceInputHandler: VoiceInputHandler
    private lateinit var btnVoiceInput: MaterialButton
    private lateinit var btnShowProgress: MaterialButton
    private lateinit var btnReset: MaterialButton
    private lateinit var tvOutput: MaterialTextView

    private val RECORD_AUDIO_REQUEST_CODE = 101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize views
        btnVoiceInput = findViewById(R.id.btnVoiceInput)
        btnShowProgress = findViewById(R.id.btnShowProgress)
        btnReset = findViewById(R.id.btnReset)
        tvOutput = findViewById(R.id.tvOutput)

        // Initialize managers
        bundleManager = BundleManager(this)
        voiceInputHandler = VoiceInputHandler(
            context = this,
            bundleManager = bundleManager,
            onResult = { result ->
                runOnUiThread {
                    tvOutput.text = result
                }
            },
            onError = { error ->
                runOnUiThread {
                    tvOutput.text = "Error: $error"
                }
            }
        )

        // Check for microphone permission
        checkAudioPermission()

        // Set up button listeners
        btnVoiceInput.setOnClickListener {
            if (checkAudioPermission()) {
                voiceInputHandler.startListening()
            }
        }

        btnShowProgress.setOnClickListener {
            val progress = bundleManager.getBundleProgress()
            tvOutput.text = progress
        }

        btnReset.setOnClickListener {
            showResetConfirmation()
        }

        // Show welcome message
        tvOutput.text = """
            Welcome to Stardew Voice Tracker!

            Voice Commands:
            • "Caught [item name]"
            • "What do I need for [season]?"
            • "Show progress"
            • "Reset"

            Example:
            "Caught the Catfish"
            "What do I need for Spring?"

            Tap the microphone to start!
        """.trimIndent()
    }

    private fun checkAudioPermission(): Boolean {
        return if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                RECORD_AUDIO_REQUEST_CODE
            )
            false
        } else {
            true
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == RECORD_AUDIO_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Microphone permission granted!", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(
                    this,
                    "Microphone permission is required for voice commands",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun showResetConfirmation() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Reset Progress")
            .setMessage("Are you sure you want to reset all your bundle progress?")
            .setPositiveButton("Yes") { _, _ ->
                bundleManager.resetProgress()
                tvOutput.text = "All progress has been reset!"
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceInputHandler.destroy()
    }
}
