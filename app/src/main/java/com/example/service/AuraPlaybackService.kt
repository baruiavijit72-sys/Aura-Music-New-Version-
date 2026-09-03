package com.example.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.IBinder
import com.example.MainActivity
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
        const val EXTRA_IS_PLAYING = "extra_is_playing"

        fun updateService(context: Context, title: String, artist: String, isPlaying: Boolean) {
            try {
                val intent = Intent(context, AuraPlaybackService::class.java).apply {
                    action = ACTION_START_OR_UPDATE
                    putExtra(EXTRA_TITLE, title)
                    putExtra(EXTRA_ARTIST, artist)
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
    private var isCurrentlyPlaying = false
    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initMediaSession()
    }

    private fun initMediaSession() {
        try {
            mediaSession = MediaSession(this, "AuraMusicPlaybackSession").apply {
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
                        stopForeground(STOP_FOREGROUND_REMOVE)
                        stopSelf()
                    }
                    override fun onSeekTo(pos: Long) {
                        AuraViewModel.activeInstance?.seekTo(pos.toFloat() / 1000f)
                    }
                })
                isActive = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
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
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START_OR_UPDATE -> {
                currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                isCurrentlyPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, isCurrentlyPlaying)
            }
        }

        updateMediaSessionState()

        val notification = buildNotification(currentTitle, currentArtist, isCurrentlyPlaying)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        return START_STICKY
    }

    private fun updateMediaSessionState() {
        try {
            mediaSession?.let { session ->
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
                        if (isCurrentlyPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED,
                        PlaybackState.PLAYBACK_POSITION_UNKNOWN,
                        1.0f
                    )
                session.setPlaybackState(stateBuilder.build())

                val metadata = MediaMetadata.Builder()
                    .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                    .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
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
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, artist: String, isPlaying: Boolean): Notification {
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

        builder
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(isPlaying)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(
                Notification.Action.Builder(
                    android.R.drawable.ic_media_previous,
                    "Previous",
                    prevPendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                    if (isPlaying) "Pause" else "Play",
                    togglePendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    android.R.drawable.ic_media_next,
                    "Next",
                    nextPendingIntent
                ).build()
            )
            .addAction(
                Notification.Action.Builder(
                    android.R.drawable.ic_menu_close_clear_cancel,
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
