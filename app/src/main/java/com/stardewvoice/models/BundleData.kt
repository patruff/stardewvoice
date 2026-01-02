package com.stardewvoice.models

data class BundleItem(
    val name: String,
    val quality: String,
    val seasons: List<String>,
    val difficulty: Int,
    val weather: String? = null,
    val time: String? = null,
    val location: String? = null,
    val quantity: Int = 1
)

data class Bundle(
    val name: String,
    val required: Int,
    val items: List<BundleItem>
)

data class BundleCategory(
    val name: String,
    val bundles: Map<String, Bundle>
)

data class AllBundles(
    val bundles: Map<String, BundleCategory>
)

data class PlayerProgress(
    val collectedItems: MutableMap<String, MutableSet<String>> = mutableMapOf(),
    val completedBundles: MutableSet<String> = mutableSetOf()
)
