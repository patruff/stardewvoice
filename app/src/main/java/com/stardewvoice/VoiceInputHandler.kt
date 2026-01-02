package com.stardewvoice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.Locale

class VoiceInputHandler(
    private val context: Context,
    private val bundleManager: BundleManager,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false

    init {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
            setupRecognitionListener()
        }
    }

    private fun setupRecognitionListener() {
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                isListening = true
                onResult("Listening...")
            }

            override fun onBeginningOfSpeech() {}

            override fun onRmsChanged(rmsdB: Float) {}

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
                isListening = false
            }

            override fun onError(error: Int) {
                isListening = false
                val message = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No match found. Please try again."
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected"
                    else -> "Unknown error"
                }
                onError(message)
            }

            override fun onResults(results: Bundle?) {
                isListening = false
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val spokenText = matches[0]
                    processVoiceCommand(spokenText)
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {}

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    fun startListening() {
        if (!isListening && speechRecognizer != null) {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_PROMPT, "Say a command...")
            }
            speechRecognizer?.startListening(intent)
        }
    }

    fun stopListening() {
        if (isListening) {
            speechRecognizer?.stopListening()
            isListening = false
        }
    }

    private fun processVoiceCommand(command: String) {
        onResult("You said: \"$command\"\n\n")

        val lowerCommand = command.lowercase()

        when {
            // Pattern: "Pat caught the [item]" or "caught [item]" or "I caught [item]"
            lowerCommand.contains("caught") -> {
                val itemName = extractItemName(lowerCommand, "caught")
                if (itemName != null) {
                    val result = bundleManager.addItem(itemName)
                    onResult(result)
                } else {
                    onError("Couldn't identify the item. Please say 'caught [item name]'")
                }
            }

            // Pattern: "what do I need" or "what's needed" or "anything else"
            lowerCommand.contains("need") || lowerCommand.contains("anything") -> {
                val season = extractSeason(lowerCommand)
                if (season != null) {
                    val result = bundleManager.getNeededItems(season)
                    onResult(result)
                } else {
                    onError("Please specify a season (Spring, Summer, Fall, or Winter)")
                }
            }

            // Pattern: "show progress" or "bundle progress"
            lowerCommand.contains("progress") -> {
                val result = bundleManager.getBundleProgress()
                onResult(result)
            }

            // Pattern: "reset" or "start over"
            lowerCommand.contains("reset") || lowerCommand.contains("start over") -> {
                bundleManager.resetProgress()
                onResult("Progress has been reset!")
            }

            else -> {
                onError("Command not recognized. Try:\n" +
                        "• 'Caught [item name]'\n" +
                        "• 'What do I need for [season]?'\n" +
                        "• 'Show progress'")
            }
        }
    }

    private fun extractItemName(command: String, keyword: String): String? {
        val parts = command.split(keyword)
        if (parts.size < 2) return null

        var itemPart = parts[1].trim()

        // Remove common prefixes
        val prefixes = listOf("the ", "a ", "an ")
        for (prefix in prefixes) {
            if (itemPart.startsWith(prefix)) {
                itemPart = itemPart.substring(prefix.length)
            }
        }

        // Remove punctuation at the end
        itemPart = itemPart.replace(Regex("[.!?]$"), "")

        return if (itemPart.isNotEmpty()) itemPart else null
    }

    private fun extractSeason(command: String): String? {
        val seasons = listOf("spring", "summer", "fall", "winter")
        for (season in seasons) {
            if (command.contains(season)) {
                return season
            }
        }

        // Also check for day patterns like "spring 12"
        val dayPattern = Regex("(spring|summer|fall|winter)\\s+\\d+")
        val match = dayPattern.find(command)
        if (match != null) {
            return match.groupValues[1]
        }

        return null
    }

    fun destroy() {
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}
