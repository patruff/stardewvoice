package com.stardewvoice

import android.content.Context
import com.google.gson.Gson
import com.stardewvoice.models.*
import java.io.InputStreamReader

class BundleManager(private val context: Context) {
    private var allBundles: AllBundles
    private var playerProgress: PlayerProgress
    private val gson = Gson()

    init {
        allBundles = loadBundles()
        playerProgress = loadProgress()
    }

    private fun loadBundles(): AllBundles {
        val inputStream = context.resources.openRawResource(R.raw.bundles)
        val reader = InputStreamReader(inputStream)
        return gson.fromJson(reader, AllBundles::class.java)
    }

    private fun loadProgress(): PlayerProgress {
        val prefs = context.getSharedPreferences("stardew_progress", Context.MODE_PRIVATE)
        val json = prefs.getString("progress", null)
        return if (json != null) {
            gson.fromJson(json, PlayerProgress::class.java)
        } else {
            PlayerProgress()
        }
    }

    private fun saveProgress() {
        val prefs = context.getSharedPreferences("stardew_progress", Context.MODE_PRIVATE)
        val json = gson.toJson(playerProgress)
        prefs.edit().putString("progress", json).apply()
    }

    fun addItem(itemName: String): String {
        val normalizedName = itemName.lowercase().trim()

        // Find which bundle this item belongs to
        for ((categoryKey, category) in allBundles.bundles) {
            for ((bundleKey, bundle) in category.bundles) {
                val matchingItem = bundle.items.find {
                    it.name.lowercase() == normalizedName
                }

                if (matchingItem != null) {
                    val bundleId = "$categoryKey.$bundleKey"

                    // Check if already collected
                    if (playerProgress.collectedItems[bundleId]?.contains(matchingItem.name) == true) {
                        return "You already collected ${matchingItem.name} for ${bundle.name}!"
                    }

                    // Add to collected items
                    if (!playerProgress.collectedItems.containsKey(bundleId)) {
                        playerProgress.collectedItems[bundleId] = mutableSetOf()
                    }
                    playerProgress.collectedItems[bundleId]?.add(matchingItem.name)

                    // Check if bundle is complete
                    val collected = playerProgress.collectedItems[bundleId]?.size ?: 0
                    val message = if (collected >= bundle.required) {
                        playerProgress.completedBundles.add(bundleId)
                        "Added ${matchingItem.name}! ${bundle.name} is now COMPLETE! 🎉"
                    } else {
                        "Added ${matchingItem.name} to ${bundle.name}! ($collected/${bundle.required})"
                    }

                    saveProgress()
                    return message
                }
            }
        }

        return "Item '$itemName' not found in any bundle. Please check the name."
    }

    fun getNeededItems(season: String, day: Int? = null): String {
        val normalizedSeason = season.lowercase()
        val neededItems = mutableListOf<Pair<BundleItem, String>>()

        for ((categoryKey, category) in allBundles.bundles) {
            for ((bundleKey, bundle) in category.bundles) {
                val bundleId = "$categoryKey.$bundleKey"

                // Skip completed bundles
                if (playerProgress.completedBundles.contains(bundleId)) continue

                val collectedInBundle = playerProgress.collectedItems[bundleId] ?: setOf()
                val remaining = bundle.required - collectedInBundle.size

                if (remaining > 0) {
                    for (item in bundle.items) {
                        // Skip already collected items
                        if (collectedInBundle.contains(item.name)) continue

                        // Check if available in current season
                        if (item.seasons.map { it.lowercase() }.contains(normalizedSeason)) {
                            neededItems.add(Pair(item, bundle.name))
                        }
                    }
                }
            }
        }

        if (neededItems.isEmpty()) {
            return "Great job! You don't need anything else available in $season."
        }

        // Sort by difficulty
        val sortedItems = neededItems.sortedBy { it.first.difficulty }

        val result = StringBuilder()
        result.append("Items needed in $season:\n\n")

        var currentDifficulty = -1
        for ((item, bundleName) in sortedItems) {
            if (item.difficulty != currentDifficulty) {
                currentDifficulty = item.difficulty
                val difficultyLabel = when (currentDifficulty) {
                    1 -> "⭐ Easy"
                    2 -> "⭐⭐ Medium"
                    3 -> "⭐⭐⭐ Hard"
                    else -> "⭐⭐⭐⭐ Very Hard"
                }
                result.append("\n$difficultyLabel:\n")
            }

            result.append("• ${item.name}")
            if (item.quality == "gold") result.append(" (Gold Quality)")
            if (item.quantity > 1) result.append(" x${item.quantity}")
            result.append(" - $bundleName")

            // Add helpful hints
            val hints = mutableListOf<String>()
            item.weather?.let { hints.add(it) }
            item.time?.let { hints.add(it) }
            item.location?.let { hints.add(it.replace("_", " ")) }
            if (hints.isNotEmpty()) {
                result.append(" (${hints.joinToString(", ")})")
            }
            result.append("\n")
        }

        return result.toString()
    }

    fun getBundleProgress(): String {
        var total = 0
        var completed = 0
        val result = StringBuilder()
        result.append("Bundle Progress:\n\n")

        for ((categoryKey, category) in allBundles.bundles) {
            result.append("${category.name}:\n")

            for ((bundleKey, bundle) in category.bundles) {
                total++
                val bundleId = "$categoryKey.$bundleKey"
                val collectedCount = playerProgress.collectedItems[bundleId]?.size ?: 0
                val isComplete = playerProgress.completedBundles.contains(bundleId)

                if (isComplete) {
                    completed++
                    result.append("  ✓ ${bundle.name} - COMPLETE\n")
                } else {
                    result.append("  ○ ${bundle.name} - $collectedCount/${bundle.required}\n")
                }
            }
            result.append("\n")
        }

        result.append("Total: $completed/$total bundles complete")
        return result.toString()
    }

    fun resetProgress() {
        playerProgress = PlayerProgress()
        saveProgress()
    }
}
