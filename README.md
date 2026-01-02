# Stardew Voice - Bundle Tracker

A voice-enabled Android app for tracking Stardew Valley Community Center bundles.

## Features

- **Voice Commands**: Use natural voice input to track your progress
- **Smart Seasonal Filtering**: Get recommendations based on the current season
- **Difficulty Ratings**: Items sorted by difficulty for better planning
- **Complete Bundle Data**: All Community Center bundles included
- **Progress Tracking**: Track completion across all bundle categories

## Voice Commands

### Adding Items
- "Caught the Catfish"
- "I caught a Parsnip"
- "Caught Gold Quality Melon"

### Checking What's Needed
- "What do I need for Spring?"
- "Anything else needed, it's Summer?"
- "What's needed for Fall?"

### Viewing Progress
- "Show progress"
- "Bundle progress"

### Reset Progress
- "Reset"
- "Start over"

## Bundle Categories

The app tracks all Community Center bundles:

- **Pantry**: Spring/Summer/Fall Crops, Quality Crops, Animal Products, Artisan Goods
- **Fish Tank**: River Fish, Lake Fish, Ocean Fish, Night Fishing, Specialty Fish, Crab Pot
- **Crafts Room**: Seasonal Foraging, Construction, Exotic Foraging
- **Boiler Room**: Blacksmith's, Geologist's, Adventurer's
- **Bulletin Board**: Chef's, Dye, Field Research, Fodder, Enchanter's
- **Vault**: Gold bundles (2,500g - 25,000g)

## Building the App

### Prerequisites
- Android Studio Arctic Fox or later
- Android SDK 24 or higher
- Kotlin 1.9.0+

### Build Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd stardewvoice
```

2. Open the project in Android Studio

3. Sync Gradle files

4. Run on an emulator or physical device:
   - Click "Run" or press Shift+F10
   - Select your target device
   - Grant microphone permissions when prompted

### Building APK

```bash
./gradlew assembleDebug
```

The APK will be located at: `app/build/outputs/apk/debug/app-debug.apk`

## Permissions

The app requires the following permissions:
- **RECORD_AUDIO**: For voice recognition
- **INTERNET**: For speech recognition services (if using cloud-based recognition)

## Technical Details

### Architecture
- **Language**: Kotlin
- **UI**: Material Design 3 components
- **Voice Recognition**: Android SpeechRecognizer API
- **Data Storage**: SharedPreferences (JSON format)
- **Bundle Data**: JSON resource file

### Key Components

1. **BundleManager**: Handles bundle data and progress tracking
2. **VoiceInputHandler**: Processes voice commands and parses intents
3. **MainActivity**: UI and user interaction
4. **bundles.json**: Complete bundle database with:
   - All items and their seasons
   - Difficulty ratings (1-4 stars)
   - Special conditions (weather, time, location)
   - Quality requirements

### Data Structure

Player progress is stored as JSON:
```json
{
  "collectedItems": {
    "pantry.spring_crops": ["Parsnip", "Green Bean"],
    "fish_tank.river_fish": ["Sunfish", "Catfish"]
  },
  "completedBundles": ["pantry.spring_crops"]
}
```

## Future Enhancements

Potential features for future versions:
- Calendar integration with in-game date tracking
- Push notifications for seasonal items
- Statistics and analytics
- Backup/restore functionality
- Multi-profile support
- Integration with Stardew Valley wiki

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Disclaimer

This is an unofficial fan-made app. Stardew Valley is created by ConcernedApe.
