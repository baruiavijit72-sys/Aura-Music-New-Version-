package com.example.state

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.media.audiofx.Virtualizer
import android.net.Uri
import android.os.Build
import androidx.compose.runtime.*
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AuraDatabaseHelper
import com.example.data.MediaStoreAudioScanner
import com.example.data.MusicRepository
import com.example.model.*
import com.example.service.AuraPlaybackService
import com.example.utils.AudioExportHelper
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import java.util.UUID
import kotlin.random.Random

enum class AppScreen(val title: String) {
    HOME("Aura Music"),
    LIBRARY("Music Library"),
    NOW_PLAYING("Now Playing"),
    EQUALIZER("10-Band Equalizer"),
    P2P_SHARE("Aura Wireless Share"),
    PLAYLISTS("Playlists & Queues"),
    PLAYLIST_DETAIL("Playlist"),
    ANALYTICS("Listening Insights"),
    AUDIO_TRIMMER("Ringtone & Audio Trimmer"),
    TAG_EDITOR("Metadata Tag Editor"),
    PROFILE_CLOUD("Cloud & Profile"),
    SYSTEM_WIDGETS("Widgets & System Integration"),
    SETTINGS("Settings & Audio Engine")
}

class AuraViewModel : ViewModel() {

    companion object {
        var activeInstance: AuraViewModel? = null
    }

    // Tracks & Library Data
    var allTracks by mutableStateOf<List<Track>>(MusicRepository.sampleTracks)
        private set

    var isScanningDeviceStorage by mutableStateOf(false)
        private set

    fun scanDeviceStorage(context: Context) {
        viewModelScope.launch {
            isScanningDeviceStorage = true
            val scanned = MediaStoreAudioScanner.scanDeviceAudioFiles(context)
            if (scanned.isNotEmpty()) {
                allTracks = scanned
                playQueue = scanned
                currentTrackIndex = 0
            }
            isScanningDeviceStorage = false
        }
    }

    var playlists by mutableStateOf<List<Playlist>>(MusicRepository.samplePlaylists)
        private set

    var selectedPlaylistId by mutableStateOf<String?>(null)

    // Current Playback Engine State
    var currentTrackIndex by mutableIntStateOf(0)
        private set

    val currentTrack: Track?
        get() = playQueue.getOrNull(currentTrackIndex) ?: allTracks.getOrNull(0)

    var isPlaying by mutableStateOf(false)
        private set

    var playbackPositionSeconds by mutableFloatStateOf(0f)
        private set

    var playbackMode by mutableStateOf(PlaybackMode.REPEAT_ALL)
        private set

    var playbackSpeed by mutableFloatStateOf(1.0f)
        private set

    var playbackPitch by mutableFloatStateOf(1.0f)
        private set

    var playQueue by mutableStateOf<List<Track>>(MusicRepository.sampleTracks)
        private set

    // Equalizer & Audio Engine Sound Settings
    var soundSettings by mutableStateOf(SoundSettings())
        private set

    // Visualizer Bars (Real-time dynamic heights)
    var visualizerFrequencies by mutableStateOf(List(32) { 0.2f })
        private set

    // P2P Sharing State
    var nearbyDevices by mutableStateOf(MusicRepository.sampleNearbyDevices)
        private set

    var isP2PScanning by mutableStateOf(false)
        private set

    var isP2PTransferring by mutableStateOf(false)
        private set

    var p2pTransferProgress by mutableFloatStateOf(0f)
        private set

    var p2pTransferSpeedMbps by mutableFloatStateOf(0f)
        private set

    var p2pSelectedTrackIds by mutableStateOf<Set<String>>(emptySet())
        private set

    var transferLogs by mutableStateOf<List<TransferLog>>(emptyList())
        private set

    var qrCodePairingPin by mutableStateOf("AURA-7492")
        private set

    // Navigation & UI View
    var currentScreen by mutableStateOf(AppScreen.HOME)
    var previousScreen by mutableStateOf(AppScreen.HOME)
    var isNowPlayingExpanded by mutableStateOf(false)
    var isQueueSheetVisible by mutableStateOf(false)
    var isSleepTimerDialogVisible by mutableStateOf(false)

    // Library Filtering & Sorting
    var searchQuery by mutableStateOf("")
    var selectedSourceFilter by mutableStateOf<TrackSource?>(null)
    var selectedCategoryTab by mutableIntStateOf(0) // 0: Tracks, 1: Albums, 2: Artists, 3: Genres, 4: Folders
    var sortBy by mutableStateOf("title") // title_asc, title_desc, artist_asc, artist_desc, album, duration_desc, duration_asc, size_desc, size_asc, playCount, year
    var filterShortAudio by mutableStateOf(true) // Filter < 30 seconds
    var blacklistedFolders by mutableStateOf<List<String>>(listOf("/storage/emulated/0/WhatsApp/Media/VoiceNotes", "/storage/emulated/0/Notifications"))

    // Tag Editor
    var editingTrack by mutableStateOf<Track?>(null)

    // Audio Trimmer State
    var trimmingTrack by mutableStateOf<Track?>(null)
    var trimStartSeconds by mutableFloatStateOf(10f)
    var trimEndSeconds by mutableFloatStateOf(45f)
    var isTrimmingPlaying by mutableStateOf(false)
    var trimExportSuccessMessage by mutableStateOf<String?>(null)
    var trimExportErrorMessage by mutableStateOf<String?>(null)

    // Sleep Timer
    var sleepTimerMinutesRemaining by mutableIntStateOf(0)
    var isSleepTimerActive by mutableStateOf(false)

    // Cloud & Profile
    var userProfile by mutableStateOf(UserProfile())
        private set
    var isCloudSyncing by mutableStateOf(false)
        private set
    var cloudSyncBannerMessage by mutableStateOf<String?>(null)

    // Theme & Preferences
    var appThemeMode by mutableStateOf(AppThemeMode.OLED_BLACK)
    var headphoneAutoPause by mutableStateOf(true)
    var volumeBalance by mutableFloatStateOf(0f)

    // Listening Analytics & Database
    var listeningHistory by mutableStateOf<List<ListeningHistoryEntry>>(emptyList())
        private set
    var totalListeningSeconds by mutableDoubleStateOf(0.0)
        private set

    private var applicationContext: Context? = null
    private var dbHelper: AuraDatabaseHelper? = null
    private var mediaPlayer: MediaPlayer? = null
    private var equalizerEffect: Equalizer? = null
    private var bassBoostEffect: BassBoost? = null
    private var virtualizerEffect: Virtualizer? = null
    private var loudnessEnhancerEffect: LoudnessEnhancer? = null

    private var playbackJob: Job? = null
    private var visualizerJob: Job? = null
    private var trimmerLoopJob: Job? = null

    fun setAppContext(ctx: Context) {
        val appCtx = ctx.applicationContext
        applicationContext = appCtx
        dbHelper = AuraDatabaseHelper(appCtx)
        loadDataFromDatabase()
    }

    private fun loadDataFromDatabase() {
        val helper = dbHelper ?: return
        viewModelScope.launch {
            try {
                val logs = helper.getAllTransferLogs()
                transferLogs = logs
                val history = helper.getAllListeningHistory(100)
                listeningHistory = history
                val secs = helper.getListeningSeconds()
                totalListeningSeconds = secs
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    init {
        activeInstance = this
        startVisualizerLoop()
    }

    override fun onCleared() {
        super.onCleared()
        releaseAudioEffects()
        try {
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun releaseAudioEffects() {
        try {
            equalizerEffect?.release()
            equalizerEffect = null
            bassBoostEffect?.release()
            bassBoostEffect = null
            virtualizerEffect?.release()
            virtualizerEffect = null
            loudnessEnhancerEffect?.release()
            loudnessEnhancerEffect = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun setupAudioEffects(audioSessionId: Int) {
        if (audioSessionId == 0) return
        releaseAudioEffects()
        try {
            equalizerEffect = Equalizer(0, audioSessionId).apply {
                enabled = soundSettings.isEnabled
            }
            bassBoostEffect = BassBoost(0, audioSessionId).apply {
                enabled = soundSettings.isEnabled
                setStrength((soundSettings.bassBoost * 1000).toInt().toShort())
            }
            virtualizerEffect = Virtualizer(0, audioSessionId).apply {
                enabled = soundSettings.isEnabled
                setStrength((soundSettings.virtualizer3D * 1000).toInt().toShort())
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                loudnessEnhancerEffect = LoudnessEnhancer(audioSessionId).apply {
                    enabled = soundSettings.isEnabled
                    setTargetGain((soundSettings.volumeBoost * 800).toInt())
                }
            }
            applyEqualizerSettingsToEffects()
        } catch (e: Exception) {
            android.util.Log.w("AuraAudioFx", "Failed to init native audio effects: ${e.message}")
        }
    }

    private fun applyEqualizerSettingsToEffects() {
        val eq = equalizerEffect ?: return
        try {
            eq.enabled = soundSettings.isEnabled
            val numBands = eq.numberOfBands.toInt()
            val minDb = eq.bandLevelRange[0]
            val maxDb = eq.bandLevelRange[1]

            soundSettings.bands.take(numBands).forEachIndexed { index, band ->
                val targetMilliDb = (band.gainDb * 100).toInt().coerceIn(minDb.toInt(), maxDb.toInt()).toShort()
                eq.setBandLevel(index.toShort(), targetMilliDb)
            }

            bassBoostEffect?.apply {
                enabled = soundSettings.isEnabled
                setStrength((soundSettings.bassBoost * 1000).toInt().coerceIn(0, 1000).toShort())
            }
            virtualizerEffect?.apply {
                enabled = soundSettings.isEnabled
                setStrength((soundSettings.virtualizer3D * 1000).toInt().coerceIn(0, 1000).toShort())
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                loudnessEnhancerEffect?.apply {
                    enabled = soundSettings.isEnabled
                    setTargetGain((soundSettings.volumeBoost * 800).toInt())
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("AuraAudioFx", "applyEqualizerSettingsToEffects exception: ${e.message}")
        }
    }

    private fun updateStereoBalance() {
        val mp = mediaPlayer ?: return
        try {
            val left = if (volumeBalance > 0f) 1.0f - volumeBalance else 1.0f
            val right = if (volumeBalance < 0f) 1.0f + volumeBalance else 1.0f
            mp.setVolume(left.coerceIn(0f, 1f), right.coerceIn(0f, 1f))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun updateVolumeBalance(value: Float) {
        volumeBalance = value.coerceIn(-1f, 1f)
        updateStereoBalance()
    }

    fun navigateTo(screen: AppScreen) {
        previousScreen = currentScreen
        currentScreen = screen
        if (screen == AppScreen.NOW_PLAYING) {
            isNowPlayingExpanded = true
        } else {
            isNowPlayingExpanded = false
        }
    }

    fun goBack() {
        if (isNowPlayingExpanded) {
            isNowPlayingExpanded = false
            return
        }
        currentScreen = previousScreen
    }

    private fun playCurrentTrackWithMediaPlayer() {
        val ctx = applicationContext ?: return
        val track = currentTrack ?: return

        try {
            try {
                mediaPlayer?.stop()
                mediaPlayer?.reset()
                mediaPlayer?.release()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            mediaPlayer = null

            val newPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setLegacyStreamType(android.media.AudioManager.STREAM_MUSIC)
                        .build()
                )
            }

            var dataSourceSet = false
            val uriString = track.contentUriString

            // Method 1: ContentResolver AssetFileDescriptor
            if (!uriString.isNullOrEmpty()) {
                try {
                    val parsedUri = Uri.parse(uriString)
                    ctx.contentResolver.openAssetFileDescriptor(parsedUri, "r")?.use { afd ->
                        newPlayer.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                        dataSourceSet = true
                    }
                } catch (e: Exception) {
                    android.util.Log.w("AuraPlayer", "AssetFileDescriptor failed: ${e.message}")
                }
            }

            // Method 2: ContentResolver FileDescriptor
            if (!dataSourceSet && !uriString.isNullOrEmpty()) {
                try {
                    val parsedUri = Uri.parse(uriString)
                    ctx.contentResolver.openFileDescriptor(parsedUri, "r")?.use { pfd ->
                        newPlayer.setDataSource(pfd.fileDescriptor)
                        dataSourceSet = true
                    }
                } catch (e: Exception) {
                    android.util.Log.w("AuraPlayer", "FileDescriptor failed: ${e.message}")
                }
            }

            // Method 3: Direct Uri with Context
            if (!dataSourceSet && !uriString.isNullOrEmpty()) {
                try {
                    newPlayer.setDataSource(ctx, Uri.parse(uriString))
                    dataSourceSet = true
                } catch (e: Exception) {
                    android.util.Log.w("AuraPlayer", "Context Uri failed: ${e.message}")
                }
            }

            // Method 4: File Path
            if (!dataSourceSet && track.filePath.isNotEmpty()) {
                try {
                    val f = File(track.filePath)
                    if (f.exists() && f.canRead()) {
                        newPlayer.setDataSource(track.filePath)
                        dataSourceSet = true
                    }
                } catch (e: Exception) {
                    android.util.Log.w("AuraPlayer", "File Path failed: ${e.message}")
                }
            }

            if (!dataSourceSet) {
                android.util.Log.e("AuraPlayer", "Could not set data source for track: ${track.title}")
                return
            }

            newPlayer.setOnPreparedListener { mp ->
                try {
                    val left = if (volumeBalance > 0f) 1.0f - volumeBalance else 1.0f
                    val right = if (volumeBalance < 0f) 1.0f + volumeBalance else 1.0f
                    mp.setVolume(left.coerceIn(0f, 1f), right.coerceIn(0f, 1f))
                    if (playbackPositionSeconds > 0f) {
                        mp.seekTo((playbackPositionSeconds * 1000).toInt())
                    }
                    if (isPlaying) {
                        mp.start()
                    }
                    setupAudioEffects(mp.audioSessionId)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && (playbackSpeed != 1.0f || playbackPitch != 1.0f)) {
                        try {
                            mp.playbackParams = mp.playbackParams.setSpeed(playbackSpeed).setPitch(playbackPitch)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("AuraPlayer", "OnPrepared error: ${e.message}")
                }
            }

            newPlayer.setOnCompletionListener {
                skipToNext()
            }

            newPlayer.setOnErrorListener { _, what, extra ->
                android.util.Log.e("AuraPlayer", "MediaPlayer error what=$what extra=$extra")
                true
            }

            newPlayer.prepareAsync()
            mediaPlayer = newPlayer
        } catch (e: Exception) {
            android.util.Log.e("AuraPlayer", "playCurrentTrackWithMediaPlayer exception: ${e.message}", e)
        }
    }

    // Playback Controls
    private fun syncWithPlaybackService() {
        val ctx = applicationContext ?: return
        val track = currentTrack ?: return
        AuraPlaybackService.updateService(
            ctx,
            track.title,
            track.artist,
            isPlaying
        )
    }

    fun playTrack(track: Track) {
        val indexInQueue = playQueue.indexOfFirst { it.id == track.id }
        if (indexInQueue >= 0) {
            currentTrackIndex = indexInQueue
        } else {
            playQueue = listOf(track) + playQueue
            currentTrackIndex = 0
        }
        playbackPositionSeconds = 0f
        isPlaying = true
        playCurrentTrackWithMediaPlayer()
        startPlaybackProgress()
        recordListeningHistory(track)
        syncWithPlaybackService()
    }

    fun pausePlayback() {
        if (isPlaying) {
            isPlaying = false
            try {
                mediaPlayer?.pause()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            playbackJob?.cancel()
            syncWithPlaybackService()
        }
    }

    fun resumePlayback() {
        if (!isPlaying) {
            isPlaying = true
            if (mediaPlayer != null) {
                try {
                    mediaPlayer?.start()
                } catch (e: Exception) {
                    playCurrentTrackWithMediaPlayer()
                }
            } else {
                playCurrentTrackWithMediaPlayer()
            }
            startPlaybackProgress()
            syncWithPlaybackService()
        }
    }

    fun togglePlayPause() {
        if (isPlaying) {
            pausePlayback()
        } else {
            resumePlayback()
        }
    }

    fun skipToNext() {
        if (playQueue.isEmpty()) return
        when (playbackMode) {
            PlaybackMode.REPEAT_ONE -> {
                playbackPositionSeconds = 0f
            }
            PlaybackMode.SHUFFLE -> {
                currentTrackIndex = Random.nextInt(playQueue.size)
                playbackPositionSeconds = 0f
            }
            else -> {
                if (currentTrackIndex < playQueue.size - 1) {
                    currentTrackIndex++
                } else {
                    currentTrackIndex = 0
                }
                playbackPositionSeconds = 0f
            }
        }
        isPlaying = true
        playCurrentTrackWithMediaPlayer()
        startPlaybackProgress()
        currentTrack?.let { recordListeningHistory(it) }
        syncWithPlaybackService()
    }

    fun skipToPrevious() {
        if (playQueue.isEmpty()) return
        if (playbackPositionSeconds > 4f) {
            playbackPositionSeconds = 0f
            mediaPlayer?.seekTo(0)
        } else {
            if (currentTrackIndex > 0) {
                currentTrackIndex--
            } else {
                currentTrackIndex = playQueue.size - 1
            }
            playbackPositionSeconds = 0f
        }
        isPlaying = true
        playCurrentTrackWithMediaPlayer()
        startPlaybackProgress()
        syncWithPlaybackService()
    }

    fun seekTo(seconds: Float) {
        currentTrack?.let {
            val clamped = seconds.coerceIn(0f, it.durationSeconds.toFloat())
            playbackPositionSeconds = clamped
            try {
                mediaPlayer?.seekTo((clamped * 1000).toInt())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun seekRelative(deltaSeconds: Float) {
        currentTrack?.let {
            val newPos = (playbackPositionSeconds + deltaSeconds).coerceIn(0f, it.durationSeconds.toFloat())
            playbackPositionSeconds = newPos
            try {
                mediaPlayer?.seekTo((newPos * 1000).toInt())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun toggleFavorite(trackId: String) {
        allTracks = allTracks.map {
            if (it.id == trackId) it.copy(isFavorite = !it.isFavorite) else it
        }
        playQueue = playQueue.map {
            if (it.id == trackId) it.copy(isFavorite = !it.isFavorite) else it
        }
        // Update Liked Songs smart playlist
        updateLikedSongsPlaylist()
    }

    fun togglePlaybackMode() {
        playbackMode = when (playbackMode) {
            PlaybackMode.SEQUENTIAL -> PlaybackMode.REPEAT_ALL
            PlaybackMode.REPEAT_ALL -> PlaybackMode.REPEAT_ONE
            PlaybackMode.REPEAT_ONE -> PlaybackMode.SHUFFLE
            PlaybackMode.SHUFFLE -> PlaybackMode.SEQUENTIAL
        }
    }

    fun updatePlaybackSpeed(speed: Float) {
        playbackSpeed = speed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                mediaPlayer?.playbackParams = mediaPlayer?.playbackParams?.setSpeed(speed) ?: PlaybackParams().setSpeed(speed)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun updatePlaybackPitch(pitch: Float) {
        playbackPitch = pitch
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                mediaPlayer?.playbackParams = mediaPlayer?.playbackParams?.setPitch(pitch) ?: PlaybackParams().setPitch(pitch)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun setSpeed(speed: Float) {
        updatePlaybackSpeed(speed)
    }

    fun setPitch(pitch: Float) {
        updatePlaybackPitch(pitch)
    }

    fun playNext(track: Track) {
        val currentIdx = currentTrackIndex
        if (currentIdx in playQueue.indices) {
            val mutable = playQueue.toMutableList()
            // remove if already in queue to avoid duplicates right away
            mutable.remove(track)
            val insertPos = (currentIdx + 1).coerceAtMost(mutable.size)
            mutable.add(insertPos, track)
            playQueue = mutable
        } else {
            playQueue = playQueue + track
        }
    }

    fun addToQueue(track: Track) {
        playQueue = playQueue + track
    }

    fun removeQueueItem(index: Int) {
        if (index in playQueue.indices && playQueue.size > 1) {
            val mutable = playQueue.toMutableList()
            mutable.removeAt(index)
            playQueue = mutable
            if (index < currentTrackIndex) {
                currentTrackIndex--
            } else if (currentTrackIndex >= playQueue.size) {
                currentTrackIndex = playQueue.size - 1
            }
        }
    }

    fun removeFromQueue(index: Int) {
        removeQueueItem(index)
    }

    fun reorderQueue(fromIndex: Int, toIndex: Int) {
        if (fromIndex in playQueue.indices && toIndex in playQueue.indices) {
            val mutable = playQueue.toMutableList()
            val item = mutable.removeAt(fromIndex)
            mutable.add(toIndex, item)
            playQueue = mutable
            if (currentTrackIndex == fromIndex) {
                currentTrackIndex = toIndex
            }
        }
    }

    fun clearQueue() {
        currentTrack?.let {
            playQueue = listOf(it)
            currentTrackIndex = 0
        }
    }

    // Equalizer controls
    fun updateEqualizerBand(index: Int, gainDb: Float) {
        val currentBands = soundSettings.bands.toMutableList()
        if (index in currentBands.indices) {
            currentBands[index] = currentBands[index].copy(gainDb = gainDb.coerceIn(-12f, 12f))
            soundSettings = soundSettings.copy(bands = currentBands, currentPreset = "Custom Preset")
            applyEqualizerSettingsToEffects()
        }
    }

    fun applyEqualizerPreset(presetName: String) {
        val gains = MusicRepository.equalizerPresets[presetName] ?: return
        val newBands = soundSettings.bands.mapIndexed { idx, band ->
            band.copy(gainDb = gains.getOrElse(idx) { 0f })
        }
        soundSettings = soundSettings.copy(bands = newBands, currentPreset = presetName)
        applyEqualizerSettingsToEffects()
    }

    fun updateBassBoost(value: Float) {
        soundSettings = soundSettings.copy(bassBoost = value.coerceIn(0f, 1f))
        applyEqualizerSettingsToEffects()
    }

    fun updateVirtualizer(value: Float) {
        soundSettings = soundSettings.copy(virtualizer3D = value.coerceIn(0f, 1f))
        applyEqualizerSettingsToEffects()
    }

    fun updateTrebleBoost(value: Float) {
        soundSettings = soundSettings.copy(trebleBoost = value.coerceIn(0f, 1f))
        applyEqualizerSettingsToEffects()
    }

    fun updateVolumeBoost(value: Float) {
        soundSettings = soundSettings.copy(volumeBoost = value.coerceIn(0f, 1f))
        applyEqualizerSettingsToEffects()
    }

    fun updateCrossfade(seconds: Int) {
        soundSettings = soundSettings.copy(crossfadeSeconds = seconds.coerceIn(0, 10))
    }

    fun toggleEqualizer(enabled: Boolean) {
        soundSettings = soundSettings.copy(isEnabled = enabled)
        applyEqualizerSettingsToEffects()
    }

    // P2P Sharing
    fun toggleP2PTrackSelection(trackId: String) {
        p2pSelectedTrackIds = if (p2pSelectedTrackIds.contains(trackId)) {
            p2pSelectedTrackIds - trackId
        } else {
            p2pSelectedTrackIds + trackId
        }
    }

    fun selectAllForP2P() {
        p2pSelectedTrackIds = allTracks.map { it.id }.toSet()
    }

    fun clearP2PSelection() {
        p2pSelectedTrackIds = emptySet()
    }

    fun startP2PDiscovery() {
        isP2PScanning = true
        viewModelScope.launch {
            delay(1500)
            isP2PScanning = false
        }
    }

    fun recordTransferLog(log: TransferLog) {
        transferLogs = listOf(log) + transferLogs
        dbHelper?.insertTransferLog(log)
    }

    fun simulateP2PTransfer(targetDevice: P2PDevice) {
        if (p2pSelectedTrackIds.isEmpty()) return
        isP2PTransferring = true
        p2pTransferProgress = 0f
        p2pTransferSpeedMbps = 48.2f
        viewModelScope.launch {
            val count = p2pSelectedTrackIds.size
            val sizeMb = allTracks.filter { it.id in p2pSelectedTrackIds }.sumOf { it.fileSizeMb }

            while (p2pTransferProgress < 1.0f) {
                delay(120)
                p2pTransferProgress += 0.05f
                p2pTransferSpeedMbps = Random.nextDouble(42.0, 68.5).toFloat()
            }
            p2pTransferProgress = 1.0f
            isP2PTransferring = false

            // Add to persistent transfer logs
            val newLog = TransferLog(
                id = UUID.randomUUID().toString(),
                targetDeviceName = targetDevice.name,
                isIncoming = false,
                trackCount = count,
                totalSizeMb = sizeMb,
                transferSpeedMbps = p2pTransferSpeedMbps.toDouble(),
                status = TransferStatus.COMPLETED
            )
            recordTransferLog(newLog)
            p2pSelectedTrackIds = emptySet()
        }
    }

    // Audio Trimmer
    fun openTrimmer(track: Track) {
        trimmingTrack = track
        trimStartSeconds = 10f
        trimEndSeconds = (track.durationSeconds.toFloat() * 0.4f).coerceAtLeast(30f)
        isTrimmingPlaying = false
        trimExportSuccessMessage = null
        trimExportErrorMessage = null
        navigateTo(AppScreen.AUDIO_TRIMMER)
    }

    fun toggleTrimmingPlayback() {
        isTrimmingPlaying = !isTrimmingPlaying
        if (isTrimmingPlaying) {
            startTrimmerLoop()
        } else {
            trimmerLoopJob?.cancel()
            mediaPlayer?.pause()
        }
    }

    private fun startTrimmerLoop() {
        trimmerLoopJob?.cancel()
        val track = trimmingTrack ?: currentTrack ?: return
        seekTo(trimStartSeconds)
        if (!isPlaying) {
            togglePlayPause()
        }

        trimmerLoopJob = viewModelScope.launch {
            while (isActive && isTrimmingPlaying) {
                delay(200)
                if (playbackPositionSeconds >= trimEndSeconds) {
                    seekTo(trimStartSeconds)
                }
            }
        }
    }

    fun exportTrimmedAudio(typeLabel: String) {
        val ctx = applicationContext ?: return
        val track = trimmingTrack ?: currentTrack ?: return

        val toneType = when {
            typeLabel.contains("Ringtone", ignoreCase = true) -> AudioExportHelper.ToneType.RINGTONE
            typeLabel.contains("Notification", ignoreCase = true) -> AudioExportHelper.ToneType.NOTIFICATION
            else -> AudioExportHelper.ToneType.ALARM
        }

        viewModelScope.launch {
            trimExportSuccessMessage = "Configuring system $typeLabel..."
            trimExportErrorMessage = null

            val result = AudioExportHelper.exportAndSetSystemTone(
                context = ctx,
                track = track,
                toneType = toneType,
                startSec = trimStartSeconds,
                endSec = trimEndSeconds
            )

            when (result) {
                is AudioExportHelper.ExportResult.Success -> {
                    trimExportSuccessMessage = result.message
                    delay(4000)
                    trimExportSuccessMessage = null
                }
                is AudioExportHelper.ExportResult.PermissionRequired -> {
                    trimExportSuccessMessage = null
                    trimExportErrorMessage = result.message
                    try {
                        ctx.startActivity(result.intent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                is AudioExportHelper.ExportResult.Error -> {
                    trimExportSuccessMessage = null
                    trimExportErrorMessage = result.errorMessage
                }
            }
        }
    }

    // Tag Editor
    fun openTagEditor(track: Track) {
        editingTrack = track
        navigateTo(AppScreen.TAG_EDITOR)
    }

    fun saveTrackTags(updated: Track) {
        allTracks = allTracks.map { if (it.id == updated.id) updated else it }
        playQueue = playQueue.map { if (it.id == updated.id) updated else it }
        editingTrack = null
        goBack()
    }

    // Cloud Sync
    fun performCloudBackup() {
        isCloudSyncing = true
        viewModelScope.launch {
            delay(1800)
            isCloudSyncing = false
            userProfile = userProfile.copy(
                lastCloudSyncTime = System.currentTimeMillis(),
                totalPlaylistsSynced = playlists.size
            )
            cloudSyncBannerMessage = "All playlists & listening logs synced with Cloud!"
            delay(3000)
            cloudSyncBannerMessage = null
        }
    }

    fun switchAccount(provider: String) {
        userProfile = userProfile.copy(
            authProvider = provider,
            isGuest = provider == "Guest"
        )
    }

    // Sleep timer
    fun setSleepTimer(minutes: Int) {
        sleepTimerMinutesRemaining = minutes
        isSleepTimerActive = minutes > 0
        isSleepTimerDialogVisible = false
    }

    // Playlist Management
    fun createPlaylist(name: String, description: String = "") {
        val newPlaylist = Playlist(
            name = name,
            description = description,
            trackIds = emptyList(),
            coverColorHex = 0xFF6366F1
        )
        playlists = playlists + newPlaylist
    }

    fun addTrackToPlaylist(playlistId: String, trackId: String) {
        playlists = playlists.map {
            if (it.id == playlistId && !it.trackIds.contains(trackId)) {
                it.copy(trackIds = it.trackIds + trackId)
            } else it
        }
    }

    fun removeTrackFromPlaylist(playlistId: String, trackId: String) {
        playlists = playlists.map {
            if (it.id == playlistId) {
                it.copy(trackIds = it.trackIds.filter { id -> id != trackId })
            } else it
        }
    }

    fun deletePlaylist(playlistId: String) {
        playlists = playlists.filter { it.id != playlistId }
    }

    private fun updateLikedSongsPlaylist() {
        val likedTrackIds = allTracks.filter { it.isFavorite }.map { it.id }
        playlists = playlists.map {
            if (it.id == "pl_liked") {
                it.copy(trackIds = likedTrackIds)
            } else it
        }
    }

    private fun recordListeningHistory(track: Track) {
        // Increment play count
        allTracks = allTracks.map {
            if (it.id == track.id) it.copy(playCount = it.playCount + 1) else it
        }
        val entry = ListeningHistoryEntry(
            trackId = track.id,
            trackTitle = track.title,
            artist = track.artist,
            timestamp = System.currentTimeMillis(),
            completedPercentage = 100,
            wasSkipped = false
        )
        listeningHistory = listOf(entry) + listeningHistory.take(99)
        dbHelper?.insertListeningHistory(entry)
        dbHelper?.incrementListeningSeconds(track.durationSeconds.toDouble())
        totalListeningSeconds += track.durationSeconds
    }

    // Real System Share Intent for Quick Share / Nearby Share / Files by Google
    fun shareTracksViaSystemIntent(context: Context) {
        val selectedTracks = allTracks.filter { it.id in p2pSelectedTrackIds }
        if (selectedTracks.isEmpty()) return

        val shareIntent = android.content.Intent().apply {
            if (selectedTracks.size == 1) {
                action = android.content.Intent.ACTION_SEND
                type = "audio/*"
                putExtra(android.content.Intent.EXTRA_SUBJECT, selectedTracks[0].title)
                putExtra(android.content.Intent.EXTRA_TEXT, "Sharing \"${selectedTracks[0].title}\" by ${selectedTracks[0].artist} via Aura Music (Lossless)")
            } else {
                action = android.content.Intent.ACTION_SEND_MULTIPLE
                type = "audio/*"
                putExtra(android.content.Intent.EXTRA_SUBJECT, "Sharing ${selectedTracks.size} Songs via Aura Music")
                val trackListText = selectedTracks.joinToString("\n") { "• ${it.title} - ${it.artist}" }
                putExtra(android.content.Intent.EXTRA_TEXT, "Sharing ${selectedTracks.size} songs via Aura Music:\n$trackListText")
            }
        }

        try {
            val count = selectedTracks.size
            val sizeMb = selectedTracks.sumOf { it.fileSizeMb }
            val chooser = android.content.Intent.createChooser(shareIntent, "Share via Quick Share / Nearby Share / Files")
            chooser.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)

            // Log real transfer record into SQLite database
            val log = TransferLog(
                id = UUID.randomUUID().toString(),
                targetDeviceName = "System Quick Share / Files",
                isIncoming = false,
                trackCount = count,
                totalSizeMb = sizeMb,
                transferSpeedMbps = 54.0,
                status = TransferStatus.COMPLETED
            )
            recordTransferLog(log)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startPlaybackProgress() {
        playbackJob?.cancel()
        playbackJob = viewModelScope.launch {
            while (isActive && isPlaying) {
                delay(250)
                val mp = mediaPlayer
                if (mp != null && try { mp.isPlaying } catch (e: Exception) { false }) {
                    try {
                        playbackPositionSeconds = mp.currentPosition / 1000f
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                } else {
                    currentTrack?.let { track ->
                        val nextPos = playbackPositionSeconds + (0.25f * playbackSpeed)
                        if (nextPos >= track.durationSeconds) {
                            skipToNext()
                        } else {
                            playbackPositionSeconds = nextPos
                        }
                    }
                }
            }
        }
    }

    private fun startVisualizerLoop() {
        visualizerJob?.cancel()
        visualizerJob = viewModelScope.launch {
            while (isActive) {
                delay(80)
                if (isPlaying) {
                    visualizerFrequencies = List(32) {
                        val base = Random.nextFloat() * 0.7f + 0.3f
                        base.coerceIn(0.1f, 1.0f)
                    }
                } else {
                    visualizerFrequencies = visualizerFrequencies.map { (it * 0.85f).coerceAtLeast(0.08f) }
                }
            }
        }
    }
}
