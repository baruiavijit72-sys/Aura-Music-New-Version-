package com.example.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.graphics.drawable.Icon
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.view.KeyEvent
import com.example.MainActivity
import com.example.R
import com.example.state.AuraViewModel

class AuraPlaybackService : Service() {

    companion object {
        const val CHANNEL_ID = "aura_playback_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START_OR_UPDATE = "com.example.action.START_OR_UPDATE"
        const val ACTION_PLAY = "com.example.action.PLAY"
        const val ACTION_PAUSE = "com.example.action.PAUSE"
        const val ACTION_TOGGLE = "com.example.action.TOGGLE"
        const val ACTION_NEXT = "com.example.action.NEXT"
        const val ACTION_PREVIOUS = "com.example.action.PREVIOUS"
        const val ACTION_STOP = "com.example.action.STOP"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ALBUM = "extra_album"
        const val EXTRA_DURATION = "extra_duration"
        const val EXTRA_POSITION = "extra_position"
        const val EXTRA_GRADIENT = "extra_gradient"
        const val EXTRA_IS_PLAYING = "extra_is_playing"

        fun updateService(
            context: Context,
            title: String,
            artist: String,
            album: String = "Aura Music",
            durationMs: Long = 0L,
            positionMs: Long = 0L,
            gradientColors: List<Long> = emptyList(),
            isPlaying: Boolean
        ) {
            try {
                val intent = Intent(context, AuraPlaybackService::class.java).apply {
                    action = ACTION_START_OR_UPDATE
                    putExtra(EXTRA_TITLE, title)
                    putExtra(EXTRA_ARTIST, artist)
                    putExtra(EXTRA_ALBUM, album)
                    putExtra(EXTRA_DURATION, durationMs)
                    putExtra(EXTRA_POSITION, positionMs)
                    putExtra(EXTRA_GRADIENT, gradientColors.toLongArray())
                    putExtra(EXTRA_IS_PLAYING, isPlaying)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun stopService(context: Context) {
            try {
                val intent = Intent(context, AuraPlaybackService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private var currentTitle = "Aura Music"
    private var currentArtist = "Playing your music"
    private var currentAlbum = "Lossless Audio"
    private var currentDurationMs = 240000L
    private var currentPositionMs = 0L
    private var currentGradient: LongArray? = null
    private var isCurrentlyPlaying = false
    private var mediaSession: MediaSession? = null
    private var cachedArtwork: Bitmap? = null
    private var lastArtworkKey: String = ""

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initMediaSession()
    }

    private fun initMediaSession() {
        try {
            val openAppIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                this,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val mediaButtonIntent = Intent(Intent.ACTION_MEDIA_BUTTON, null, this, AuraPlaybackService::class.java)
            val mediaButtonPendingIntent = PendingIntent.getService(
                this,
                0,
                mediaButtonIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            mediaSession = MediaSession(this, "AuraMusicPlaybackSession").apply {
                setSessionActivity(openAppPendingIntent)
                setMediaButtonReceiver(mediaButtonPendingIntent)
                @Suppress("DEPRECATION")
                setFlags(
                    MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or
                    MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
                )

                setCallback(object : MediaSession.Callback() {
                    override fun onPlay() {
                        AuraViewModel.activeInstance?.resumePlayback()
                    }
                    override fun onPause() {
                        AuraViewModel.activeInstance?.pausePlayback()
                    }
                    override fun onSkipToNext() {
                        AuraViewModel.activeInstance?.skipToNext()
                    }
                    override fun onSkipToPrevious() {
                        AuraViewModel.activeInstance?.skipToPrevious()
                    }
                    override fun onStop() {
                        AuraViewModel.activeInstance?.pausePlayback()
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            stopForeground(STOP_FOREGROUND_REMOVE)
                        } else {
                            @Suppress("DEPRECATION")
                            stopForeground(true)
                        }
                        stopSelf()
                    }
                    override fun onSeekTo(pos: Long) {
                        AuraViewModel.activeInstance?.seekTo(pos.toFloat() / 1000f)
                    }
                    override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
                        val keyEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT, KeyEvent::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT)
                        }
                        if (keyEvent?.action == KeyEvent.ACTION_DOWN) {
                            when (keyEvent.keyCode) {
                                KeyEvent.KEYCODE_MEDIA_PLAY -> AuraViewModel.activeInstance?.resumePlayback()
                                KeyEvent.KEYCODE_MEDIA_PAUSE -> AuraViewModel.activeInstance?.pausePlayback()
                                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_HEADSETHOOK -> AuraViewModel.activeInstance?.togglePlayPause()
                                KeyEvent.KEYCODE_MEDIA_NEXT -> AuraViewModel.activeInstance?.skipToNext()
                                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> AuraViewModel.activeInstance?.skipToPrevious()
                                KeyEvent.KEYCODE_MEDIA_STOP -> AuraViewModel.activeInstance?.pausePlayback()
                            }
                        }
                        return super.onMediaButtonEvent(mediaButtonIntent)
                    }
                })
                isActive = true
            }
            val initialArtwork = getOrCreateArtwork(currentTitle, currentArtist, currentGradient)
            updateMediaSessionState(initialArtwork)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (mediaSession == null) {
            initMediaSession()
        }
        when (intent?.action) {
            ACTION_PLAY -> {
                AuraViewModel.activeInstance?.resumePlayback()
            }
            ACTION_PAUSE -> {
                AuraViewModel.activeInstance?.pausePlayback()
            }
            ACTION_TOGGLE -> {
                AuraViewModel.activeInstance?.togglePlayPause()
            }
            ACTION_NEXT -> {
                AuraViewModel.activeInstance?.skipToNext()
            }
            ACTION_PREVIOUS -> {
                AuraViewModel.activeInstance?.skipToPrevious()
            }
            ACTION_STOP -> {
                AuraViewModel.activeInstance?.pausePlayback()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START_OR_UPDATE -> {
                currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                currentAlbum = intent.getStringExtra(EXTRA_ALBUM) ?: currentAlbum
                currentDurationMs = intent.getLongExtra(EXTRA_DURATION, currentDurationMs)
                currentPositionMs = intent.getLongExtra(EXTRA_POSITION, currentPositionMs)
                intent.getLongArrayExtra(EXTRA_GRADIENT)?.let { currentGradient = it }
                isCurrentlyPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, isCurrentlyPlaying)
            }
        }

        val artwork = getOrCreateArtwork(currentTitle, currentArtist, currentGradient)

        updateMediaSessionState(artwork)

        val notification = buildNotification(currentTitle, currentArtist, currentAlbum, isCurrentlyPlaying, artwork)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            // Explicitly notify to ensure instant refresh of metadata and playback state
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return START_STICKY
    }

    private fun getOrCreateArtwork(title: String, artist: String, colors: LongArray?): Bitmap {
        val key = "$title-$artist-${colors?.joinToString()}"
        if (cachedArtwork != null && lastArtworkKey == key) {
            return cachedArtwork!!
        }

        val size = 256
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val colorStart = if (colors != null && colors.isNotEmpty()) colors[0].toInt() else 0xFF0F172A.toInt()
        val colorEnd = if (colors != null && colors.size > 1) colors[1].toInt() else 0xFF06B6D4.toInt()

        val gradient = LinearGradient(
            0f, 0f, size.toFloat(), size.toFloat(),
            colorStart, colorEnd,
            Shader.TileMode.CLAMP
        )
        val bgPaint = Paint().apply {
            shader = gradient
            isAntiAlias = true
        }
        canvas.drawRect(0f, 0f, size.toFloat(), size.toFloat(), bgPaint)

        // Draw concentric glowing audio rings
        val ringPaint = Paint().apply {
            color = 0x33FFFFFF
            style = Paint.Style.STROKE
            strokeWidth = 6f
            isAntiAlias = true
        }
        canvas.drawCircle(size / 2f, size / 2f, size * 0.40f, ringPaint)
        canvas.drawCircle(size / 2f, size / 2f, size * 0.26f, ringPaint)

        // Draw stylized initial letter of the song
        val textPaint = Paint().apply {
            color = 0xFFFFFFFF.toInt()
            textSize = 86f
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
            isAntiAlias = true
        }
        val symbol = if (title.isNotBlank()) title.take(1).uppercase() else "♪"
        val yOffset = (size / 2f) - ((textPaint.descent() + textPaint.ascent()) / 2f)
        canvas.drawText(symbol, size / 2f, yOffset, textPaint)

        cachedArtwork = bitmap
        lastArtworkKey = key
        return bitmap
    }

    private fun updateMediaSessionState(artwork: Bitmap) {
        try {
            mediaSession?.let { session ->
                val pos = currentPositionMs.coerceAtLeast(0L)
                val state = if (isCurrentlyPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED

                val stateBuilder = PlaybackState.Builder()
                    .setActions(
                        PlaybackState.ACTION_PLAY or
                        PlaybackState.ACTION_PAUSE or
                        PlaybackState.ACTION_PLAY_PAUSE or
                        PlaybackState.ACTION_SKIP_TO_NEXT or
                        PlaybackState.ACTION_SKIP_TO_PREVIOUS or
                        PlaybackState.ACTION_STOP or
                        PlaybackState.ACTION_SEEK_TO
                    )
                    .setState(
                        state,
                        pos,
                        if (isCurrentlyPlaying) 1.0f else 0.0f,
                        SystemClock.elapsedRealtime()
                    )
                session.setPlaybackState(stateBuilder.build())

                val metadata = MediaMetadata.Builder()
                    .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                    .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
                    .putString(MediaMetadata.METADATA_KEY_ALBUM, currentAlbum)
                    .putLong(MediaMetadata.METADATA_KEY_DURATION, currentDurationMs.coerceAtLeast(1000L))
                    .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, artwork)
                    .putBitmap(MediaMetadata.METADATA_KEY_ART, artwork)
                    .putBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON, artwork)
                    .build()

                session.setMetadata(metadata)
                session.isActive = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        try {
            mediaSession?.apply {
                isActive = false
                release()
            }
            mediaSession = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Aura Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Foreground playback notification for Aura Music"
                setShowBadge(false)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        title: String,
        artist: String,
        album: String,
        isPlaying: Boolean,
        artwork: Bitmap
    ): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val prevIntent = Intent(this, AuraPlaybackService::class.java).apply { action = ACTION_PREVIOUS }
        val prevPendingIntent = PendingIntent.getService(this, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val toggleIntent = Intent(this, AuraPlaybackService::class.java).apply { action = ACTION_TOGGLE }
        val togglePendingIntent = PendingIntent.getService(this, 2, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val nextIntent = Intent(this, AuraPlaybackService::class.java).apply { action = ACTION_NEXT }
        val nextPendingIntent = PendingIntent.getService(this, 3, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val stopIntent = Intent(this, AuraPlaybackService::class.java).apply { action = ACTION_STOP }
        val stopPendingIntent = PendingIntent.getService(this, 4, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        val prevIcon = Icon.createWithResource(this, R.drawable.ic_notif_prev)
        val toggleIcon = Icon.createWithResource(this, if (isPlaying) R.drawable.ic_notif_pause else R.drawable.ic_notif_play)
        val nextIcon = Icon.createWithResource(this, R.drawable.ic_notif_next)
        val closeIcon = Icon.createWithResource(this, R.drawable.ic_notif_close)

        builder
            .setContentTitle(title)
            .setContentText(if (artist.isNotBlank() && album.isNotBlank()) "$artist • $album" else artist)
            .setSmallIcon(R.drawable.ic_stat_music)
            .setLargeIcon(artwork)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(isPlaying)
            .setCategory(Notification.CATEGORY_TRANSPORT)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setShowWhen(false)
            .addAction(
                Notification.Action.Builder(
                    prevIcon,
                    "Previous",
                    prevPendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    toggleIcon,
                    if (isPlaying) "Pause" else "Play",
                    togglePendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    nextIcon,
                    "Next",
                    nextPendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    closeIcon,
                    "Close",
                    stopPendingIntent
                ).build()
            )

        if (mediaSession != null) {
            builder.setStyle(
                Notification.MediaStyle()
                    .setMediaSession(mediaSession!!.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
        }

        return builder.build()
    }
}
