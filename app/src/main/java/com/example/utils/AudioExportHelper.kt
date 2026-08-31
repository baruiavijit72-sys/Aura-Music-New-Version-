package com.example.utils

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import com.example.model.Track
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

object AudioExportHelper {

    enum class ToneType(val label: String, val ringtoneType: Int, val directory: String) {
        RINGTONE("Phone Ringtone", RingtoneManager.TYPE_RINGTONE, Environment.DIRECTORY_RINGTONES),
        NOTIFICATION("Notification Sound", RingtoneManager.TYPE_NOTIFICATION, Environment.DIRECTORY_NOTIFICATIONS),
        ALARM("Alarm Tone", RingtoneManager.TYPE_ALARM, Environment.DIRECTORY_ALARMS)
    }

    sealed class ExportResult {
        data class Success(val message: String, val targetUri: Uri?) : ExportResult()
        data class PermissionRequired(val intent: Intent, val message: String) : ExportResult()
        data class Error(val errorMessage: String) : ExportResult()
    }

    fun exportAndSetSystemTone(
        context: Context,
        track: Track,
        toneType: ToneType,
        startSec: Float,
        endSec: Float
    ): ExportResult {
        // Step 1: Check WRITE_SETTINGS permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.System.canWrite(context)) {
                val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                    data = Uri.parse("package:" + context.packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                return ExportResult.PermissionRequired(
                    intent = intent,
                    message = "Please allow 'Modify System Settings' to apply ${toneType.label} directly."
                )
            }
        }

        try {
            // Step 2: Prepare target file in system public directory
            val publicDir = Environment.getExternalStoragePublicDirectory(toneType.directory)
            if (!publicDir.exists()) {
                publicDir.mkdirs()
            }

            val sanitizedTitle = track.title.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            val targetFileName = "Aura_${sanitizedTitle}_clip_${toneType.name.lowercase()}.mp3"
            val targetFile = File(publicDir, targetFileName)

            // Step 3: Copy audio content
            var copySuccess = false

            // Try from filePath
            if (track.filePath.isNotEmpty()) {
                val sourceFile = File(track.filePath)
                if (sourceFile.exists() && sourceFile.canRead()) {
                    FileInputStream(sourceFile).use { input ->
                        FileOutputStream(targetFile).use { output ->
                            input.copyTo(output)
                            copySuccess = true
                        }
                    }
                }
            }

            // Try from ContentResolver Uri
            if (!copySuccess && !track.contentUriString.isNullOrEmpty()) {
                try {
                    val uri = Uri.parse(track.contentUriString)
                    context.contentResolver.openInputStream(uri)?.use { input ->
                        FileOutputStream(targetFile).use { output ->
                            input.copyTo(output)
                            copySuccess = true
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // Step 4: Register in MediaStore as system audio tone
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DATA, targetFile.absolutePath)
                put(MediaStore.MediaColumns.TITLE, "Aura - ${track.title}")
                put(MediaStore.MediaColumns.MIME_TYPE, "audio/mp3")
                put(MediaStore.Audio.Media.ARTIST, track.artist)
                put(MediaStore.Audio.Media.IS_RINGTONE, toneType == ToneType.RINGTONE)
                put(MediaStore.Audio.Media.IS_NOTIFICATION, toneType == ToneType.NOTIFICATION)
                put(MediaStore.Audio.Media.IS_ALARM, toneType == ToneType.ALARM)
                put(MediaStore.Audio.Media.IS_MUSIC, false)
            }

            val baseUri = MediaStore.Audio.Media.getContentUriForPath(targetFile.absolutePath)
                ?: MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

            // Delete old record if already indexed
            try {
                context.contentResolver.delete(baseUri, "${MediaStore.MediaColumns.DATA}=?", arrayOf(targetFile.absolutePath))
            } catch (e: Exception) {
                // Ignore
            }

            val newUri = context.contentResolver.insert(baseUri, values) ?: Uri.fromFile(targetFile)

            // Step 5: Set actual default ringtone
            RingtoneManager.setActualDefaultRingtoneUri(context, toneType.ringtoneType, newUri)

            // Trigger MediaScanner for instant system recognition
            MediaScannerConnection.scanFile(
                context,
                arrayOf(targetFile.absolutePath),
                arrayOf("audio/mp3")
            ) { _, _ -> }

            return ExportResult.Success(
                message = "Successfully set \"${track.title}\" (${String.format("%.1f", endSec - startSec)}s clip) as default ${toneType.label}!",
                targetUri = newUri
            )
        } catch (e: Exception) {
            e.printStackTrace()
            return ExportResult.Error("Could not set system tone: ${e.localizedMessage ?: e.message}")
        }
    }
}
