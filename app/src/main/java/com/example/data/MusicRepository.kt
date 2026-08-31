package com.example.data

import com.example.model.*
import java.util.UUID

object MusicRepository {

    val sampleTracks: List<Track> = listOf(
        Track(
            id = "track_1",
            title = "Midnight Horizon",
            artist = "Neon Eclipse",
            album = "Cybernetic Dreams",
            durationSeconds = 248,
            format = AudioFormat.FLAC,
            source = TrackSource.LOCAL,
            coverGradient = listOf(0xFF0F172A, 0xFF3B82F6, 0xFF8B5CF6),
            year = 2024,
            genre = "Synthwave",
            trackNumber = 1,
            fileSizeMb = 34.2,
            playCount = 142,
            isFavorite = true,
            lyricsLrc = """
                [00:00.00] (Instrumental synth intro)
                [00:12.50] Gliding through the neon rain
                [00:19.80] City lights reflect the pain
                [00:26.40] Electric pulses in the dark
                [00:33.20] Ignite a hyper-dimensional spark
                [00:41.00] Midnight Horizon, call my name
                [00:48.50] In this cybernetic game
                [00:56.20] Echoes of a distant star
                [01:04.10] Tell us who we really are
                [01:15.00] (Bass drop & atmospheric solo)
                [01:32.40] Speeding down the vacuum line
                [01:39.90] Frozen in accelerated time
                [01:47.30] Midnight Horizon, take me home
                [01:55.00] Where the digital spirits roam
            """.trimIndent(),
            folderPath = "/storage/emulated/0/Music/HiRes_Flac"
        ),
        Track(
            id = "track_2",
            title = "Aether Resonance",
            artist = "Sola & The Cosmos",
            album = "Celestial Resonance",
            durationSeconds = 215,
            format = AudioFormat.WAV,
            source = TrackSource.LOCAL,
            coverGradient = listOf(0xFF1E1B4B, 0xFF6366F1, 0xFFEC4899),
            year = 2024,
            genre = "Ambient Chill",
            trackNumber = 2,
            fileSizeMb = 48.6,
            playCount = 98,
            isFavorite = true,
            lyricsLrc = """
                [00:00.00] (Ambient chimes & deep bass drone)
                [00:14.00] Drifting into zero gravity
                [00:22.50] Floating in ethereal harmony
                [00:30.00] Aether resonance waves unfold
                [00:38.20] Ancient stories softly told
                [00:50.00] Stardust falling through our hands
                [00:59.00] Across uncharted astral lands
                [01:12.00] Feel the frequency align
                [01:21.00] Sacred geometry divine
            """.trimIndent(),
            folderPath = "/storage/emulated/0/Music/WAV_Lossless"
        ),
        Track(
            id = "track_3",
            title = "Quantum Pulse",
            artist = "Vektor 9",
            album = "Neural Uplink",
            durationSeconds = 188,
            format = AudioFormat.MP3,
            source = TrackSource.P2P_RECEIVED,
            coverGradient = listOf(0xFF064E3B, 0xFF10B981, 0xFF06B6D4),
            year = 2023,
            genre = "Deep Techno",
            trackNumber = 3,
            fileSizeMb = 7.8,
            playCount = 84,
            isFavorite = false,
            lyricsLrc = """
                [00:00.00] (Sub-bass thumps)
                [00:10.00] Uplink established.
                [00:18.00] Synchronize frequencies.
                [00:28.00] 128 BPM pulse locked.
                [00:40.00] Quantum state coherence 99.4%
                [00:55.00] Transmitting neural audio packets.
                [01:10.00] Feel the sub-bass pressure.
            """.trimIndent(),
            folderPath = "/storage/emulated/0/AuraShare/Received"
        ),
        Track(
            id = "track_4",
            title = "Sunset Overdrive",
            artist = "Kavinsky Waves",
            album = "Pacific Highway 101",
            durationSeconds = 265,
            format = AudioFormat.FLAC,
            source = TrackSource.LOCAL,
            coverGradient = listOf(0xFF431407, 0xFFF97316, 0xFFFBBF24),
            year = 2024,
            genre = "Retrowave",
            trackNumber = 4,
            fileSizeMb = 39.1,
            playCount = 112,
            isFavorite = true,
            lyricsLrc = """
                [00:00.00] (Engine rev & analog synthesizer)
                [00:16.00] Top down, chasing the orange glow
                [00:24.00] Nowhere to be, just let it flow
                [00:32.00] 80s tape in the stereo bay
                [00:40.00] Driving yesterday away
                [00:52.00] Sunset Overdrive, burning bright
                [01:02.00] Lost in the Californian night
            """.trimIndent(),
            folderPath = "/storage/emulated/0/Music/Retrowave"
        ),
        Track(
            id = "track_5",
            title = "Aurora Borealis (Acoustic Mix)",
            artist = "Freya Lind",
            album = "Nordic Solitude",
            durationSeconds = 230,
            format = AudioFormat.M4A,
            source = TrackSource.IMPORTED,
            coverGradient = listOf(0xFF0F766E, 0xFF14B8A6, 0xFFA7F3D0),
            year = 2023,
            genre = "Acoustic / Folk",
            trackNumber = 1,
            fileSizeMb = 16.4,
            playCount = 65,
            isFavorite = false,
            lyricsLrc = """
                [00:00.00] (Gentle fingerpicked 12-string guitar)
                [00:15.00] Winter winds begin to blow
                [00:23.00] Footsteps in the virgin snow
                [00:31.00] Green lights dancing in the sky
                [00:39.00] Wondering how the years went by
                [00:50.00] Keep the campfire burning warm
                [00:58.00] Shelter from the Arctic storm
            """.trimIndent(),
            folderPath = "/storage/sdcard1/Lossless_Folk"
        ),
        Track(
            id = "track_6",
            title = "Solar Flare Velocity",
            artist = "Hyperion Core",
            album = "Orbital Strike",
            durationSeconds = 210,
            format = AudioFormat.AAC,
            source = TrackSource.P2P_RECEIVED,
            coverGradient = listOf(0xFF831843, 0xFFF43F5E, 0xFFFDA4AF),
            year = 2024,
            genre = "Drum & Bass",
            trackNumber = 5,
            fileSizeMb = 9.2,
            playCount = 76,
            isFavorite = false,
            lyricsLrc = """
                [00:00.00] (174 BPM fast breakbeat intro)
                [00:08.00] Solar Flare!
                [00:15.00] Reaching escape velocity!
                [00:30.00] Maximum throttle engagement.
                [00:45.00] Breaking through the atmosphere!
            """.trimIndent(),
            folderPath = "/storage/emulated/0/AuraShare/Received"
        ),
        Track(
            id = "track_7",
            title = "Tokyo Rain Reflections",
            artist = "Lo-Fi Odyssey",
            album = "Shibuya Midnight",
            durationSeconds = 175,
            format = AudioFormat.FLAC,
            source = TrackSource.LOCAL,
            coverGradient = listOf(0xFF312E81, 0xFF4F46E5, 0xFF818CF8),
            year = 2024,
            genre = "Lo-Fi Hip Hop",
            trackNumber = 2,
            fileSizeMb = 26.8,
            playCount = 189,
            isFavorite = true,
            lyricsLrc = """
                [00:00.00] (Vinyl crackle & gentle rainfall)
                [00:12.00] Coffee brewing in the cup
                [00:22.00] City never looking up
                [00:34.00] Umbrellas drifting down the street
                [00:46.00] Gentle rhythm, mellow beat
            """.trimIndent(),
            folderPath = "/storage/emulated/0/Music/LoFi_Sessions"
        ),
        Track(
            id = "track_8",
            title = "Nocturne in C-Sharp Minor",
            artist = "Elena Rostova",
            album = "Grand Masterworks",
            durationSeconds = 295,
            format = AudioFormat.WAV,
            source = TrackSource.IMPORTED,
            coverGradient = listOf(0xFF18181B, 0xFF52525B, 0xFFA1A1AA),
            year = 2022,
            genre = "Classical Piano",
            trackNumber = 8,
            fileSizeMb = 59.4,
            playCount = 42,
            isFavorite = false,
            lyricsLrc = """
                [00:00.00] (Solemn Steinway & Sons Grand Piano - Lento con gran espressione)
                [01:00.00] (Dynamic arpeggio transitions)
                [02:00.00] (Pianissimo delicate resolution)
            """.trimIndent(),
            folderPath = "/storage/sdcard1/Classical_Vault"
        )
    )

    val samplePlaylists: List<Playlist> = listOf(
        Playlist(
            id = "pl_most_played",
            name = "Most Played Tracks",
            description = "Smart auto-playlist based on highest play counts",
            trackIds = listOf("track_7", "track_1", "track_4", "track_2"),
            isSmartPlaylist = true,
            isPinned = true,
            coverColorHex = 0xFF3B82F6
        ),
        Playlist(
            id = "pl_liked",
            name = "Liked Songs",
            description = "All tracks marked with favorite heart",
            trackIds = listOf("track_1", "track_2", "track_4", "track_7"),
            isSmartPlaylist = true,
            isPinned = true,
            coverColorHex = 0xFFEC4899
        ),
        Playlist(
            id = "pl_hires",
            name = "Hi-Res Studio Vault",
            description = "Lossless 24-bit FLAC & WAV masters",
            trackIds = listOf("track_1", "track_2", "track_4", "track_7", "track_8"),
            isSmartPlaylist = false,
            isPinned = true,
            coverColorHex = 0xFF10B981
        ),
        Playlist(
            id = "pl_p2p",
            name = "P2P Wireless Received",
            description = "Tracks received via Wi-Fi Direct zero-data transfer",
            trackIds = listOf("track_3", "track_6"),
            isSmartPlaylist = true,
            isPinned = false,
            coverColorHex = 0xFFF59E0B
        ),
        Playlist(
            id = "pl_late_night",
            name = "Midnight Focus & Chill",
            description = "Ambient and synth melodies for late hours",
            trackIds = listOf("track_1", "track_2", "track_7"),
            isSmartPlaylist = false,
            isPinned = false,
            coverColorHex = 0xFF8B5CF6
        )
    )

    val sampleNearbyDevices: List<P2PDevice> = listOf(
        P2PDevice(
            id = "dev_1",
            name = "Pixel 9 Pro XL",
            model = "Google Pixel 9 Pro",
            connectionType = "Wi-Fi Direct (5.8 GHz)",
            signalStrength = 98,
            ipAddress = "192.168.49.1",
            isPaired = true
        ),
        P2PDevice(
            id = "dev_2",
            name = "Galaxy S24 Ultra",
            model = "Samsung SM-S928B",
            connectionType = "Local Hotspot P2P",
            signalStrength = 85,
            ipAddress = "192.168.49.15",
            isPaired = false
        ),
        P2PDevice(
            id = "dev_3",
            name = "Aura Studio Pod",
            model = "Hi-Fi Wireless Receiver",
            connectionType = "Bluetooth 5.4 + Wi-Fi",
            signalStrength = 92,
            ipAddress = "192.168.49.44",
            isPaired = false
        )
    )

    val sampleTransferLogs: List<TransferLog> = emptyList()

    val sampleListeningHistory: List<ListeningHistoryEntry> = emptyList()

    val equalizerPresets = mapOf(
        "Aura Bass Pro" to listOf(4.5f, 6.0f, 3.5f, 1.0f, -1.0f, 0.5f, 2.0f, 4.0f, 5.5f, 6.5f),
        "Flat (Studio Reference)" to listOf(0f, 0f, 0f, 0f, 0f, 0f, 0f, 0f, 0f, 0f),
        "Rock / Metal" to listOf(5.0f, 3.5f, 1.5f, -1.0f, -0.5f, 1.0f, 3.0f, 5.0f, 6.0f, 5.5f),
        "Vocal Clarity" to listOf(-2.0f, -1.0f, 0.0f, 2.0f, 4.5f, 5.0f, 4.0f, 2.5f, 1.0f, 0.0f),
        "Electronic & EDM" to listOf(6.5f, 5.5f, 2.0f, 0.0f, -1.5f, 1.5f, 3.0f, 4.5f, 6.0f, 7.0f),
        "Classical Symphony" to listOf(3.0f, 2.0f, 1.0f, 1.0f, -0.5f, 0.5f, 2.5f, 3.5f, 4.0f, 4.5f),
        "Jazz & Warm Brass" to listOf(3.5f, 2.5f, 1.0f, 2.0f, -1.0f, -0.5f, 1.5f, 2.5f, 3.5f, 4.0f),
        "Acoustic Live" to listOf(2.5f, 3.0f, 1.5f, 0.5f, 1.5f, 2.0f, 3.0f, 3.5f, 4.0f, 4.5f)
    )

    fun parseLrc(lrcText: String): List<LyricLine> {
        val lines = mutableListOf<LyricLine>()
        val regex = Regex("""\[(\d{2}):(\d{2})\.(\d{2})](.*)""")
        lrcText.lines().forEach { line ->
            val match = regex.find(line.trim())
            if (match != null) {
                val min = match.groupValues[1].toIntOrNull() ?: 0
                val sec = match.groupValues[2].toIntOrNull() ?: 0
                val centi = match.groupValues[3].toIntOrNull() ?: 0
                val totalSeconds = (min * 60) + sec + (centi / 100f)
                val text = match.groupValues[4].trim()
                if (text.isNotEmpty()) {
                    lines.add(LyricLine(totalSeconds, text))
                }
            }
        }
        return lines.sortedBy { it.timestampSeconds }
    }
}
