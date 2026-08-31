package com.example.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
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

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
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

        // Return START_STICKY so Android OS recreates the service if killed,
        // ensuring playback and background session remain persistent
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Crucial: When the user swipes away the app from the recent apps / task manager (side screen),
        // we DO NOT stop the service if audio is playing. The foreground service continues running!
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

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(isPlaying)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent)
            .addAction(
                if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                if (isPlaying) "Pause" else "Play",
                togglePendingIntent
            )
            .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close", stopPendingIntent)

        return builder.build()
    }
}
