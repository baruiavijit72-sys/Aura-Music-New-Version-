package com.example.model

import java.util.UUID

enum class AudioFormat(val extension: String, val bitDepth: String, val isLossless: Boolean) {
    FLAC("FLAC", "24-bit / 96kHz", true),
    MP3("MP3", "320 kbps", false),
    WAV("WAV", "24-bit / 192kHz", true),
    AAC("AAC", "256 kbps", false),
    M4A("M4A", "Lossless ALAC", true),
    OGG("OGG", "320 kbps", false),
    OPUS("OPUS", "160 kbps", false)
}

enum class TrackSource(val label: String) {
    LOCAL("Local Device"),
    P2P_RECEIVED("P2P Received"),
    IMPORTED("External SD Card")
}

data class Track(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val artist: String,
    val album: String,
    val durationSeconds: Int,
    val format: AudioFormat,
    val source: TrackSource = TrackSource.LOCAL,
    val coverGradient: List<Long>, // ARGB hex colors for dynamic UI tinting
    val year: Int = 2024,
    val genre: String = "Electronic",
    val trackNumber: Int = 1,
    val fileSizeMb: Double = 24.5,
    val playCount: Int = 0,
    val isFavorite: Boolean = false,
    val lyricsLrc: String = "",
    val folderPath: String = "/storage/emulated/0/Music",
    val contentUriString: String? = null,
    val filePath: String = ""
) {
    val durationFormatted: String
        get() {
            val minutes = durationSeconds / 60
            val seconds = durationSeconds % 60
            return String.format("%d:%02d", minutes, seconds)
        }
}

data class LyricLine(
    val timestampSeconds: Float,
    val text: String
)

data class Playlist(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String = "",
    val trackIds: List<String> = emptyList(),
    val isSmartPlaylist: Boolean = false,
    val isPinned: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val coverColorHex: Long = 0xFF6366F1
)

enum class PlaybackMode {
    SEQUENTIAL,
    REPEAT_ALL,
    REPEAT_ONE,
    SHUFFLE
}

data class EqualizerBand(
    val frequencyLabel: String,
    val gainDb: Float // -12f to +12f
)

data class SoundSettings(
    val isEnabled: Boolean = true,
    val currentPreset: String = "Aura Bass Pro",
    val bands: List<EqualizerBand> = listOf(
        EqualizerBand("31Hz", 4.5f),
        EqualizerBand("62Hz", 6.0f),
        EqualizerBand("125Hz", 3.5f),
        EqualizerBand("250Hz", 1.0f),
        EqualizerBand("500Hz", -1.0f),
        EqualizerBand("1kHz", 0.5f),
        EqualizerBand("2kHz", 2.0f),
        EqualizerBand("4kHz", 4.0f),
        EqualizerBand("8kHz", 5.5f),
        EqualizerBand("16kHz", 6.5f)
    ),
    val bassBoost: Float = 0.75f, // 0..1
    val virtualizer3D: Float = 0.60f, // 0..1
    val trebleBoost: Float = 0.45f, // 0..1
    val volumeBoost: Float = 0.20f, // 0..1
    val leftRightBalance: Float = 0.0f, // -1f (left) to +1f (right)
    val replayGainEnabled: Boolean = true,
    val gaplessPlayback: Boolean = true,
    val crossfadeSeconds: Int = 3
)

enum class TransferStatus {
    CONNECTING,
    PAIRING_VERIFIED,
    TRANSFERRING,
    COMPLETED,
    FAILED
}

data class P2PDevice(
    val id: String,
    val name: String,
    val model: String,
    val connectionType: String = "Wi-Fi Direct (5GHz)",
    val signalStrength: Int = 95, // 0-100%
    val ipAddress: String = "192.168.49.12",
    val isPaired: Boolean = false
)

data class TransferLog(
    val id: String = UUID.randomUUID().toString(),
    val targetDeviceName: String,
    val isIncoming: Boolean,
    val trackCount: Int,
    val totalSizeMb: Double,
    val transferSpeedMbps: Double,
    val timestamp: Long = System.currentTimeMillis(),
    val status: TransferStatus = TransferStatus.COMPLETED
)

data class UserProfile(
    val id: String = "user_aura_88",
    val displayName: String = "Avijit Barui",
    val email: String = "baruiavijit72@gmail.com",
    val authProvider: String = "Google",
    val isGuest: Boolean = false,
    val avatarInitials: String = "AB",
    val lastCloudSyncTime: Long = System.currentTimeMillis(),
    val totalPlaylistsSynced: Int = 14,
    val totalCloudBackupSizeMb: Double = 18.4,
    val isVip: Boolean = false
)

data class ListeningHistoryEntry(
    val trackId: String,
    val trackTitle: String,
    val artist: String,
    val timestamp: Long,
    val completedPercentage: Int, // 0..100
    val wasSkipped: Boolean
)

enum class AppThemeMode {
    OLED_BLACK,
    DARK_MATERIAL,
    LIGHT_AIR,
    DYNAMIC_ALBUM_ART
}
