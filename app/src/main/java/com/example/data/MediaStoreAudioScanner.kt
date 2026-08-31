package com.example.data

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.example.model.AudioFormat
import com.example.model.Track
import com.example.model.TrackSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

object MediaStoreAudioScanner {

    suspend fun scanDeviceAudioFiles(context: Context): List<Track> = withContext(Dispatchers.IO) {
        val tracksList = mutableListOf<Track>()
        val contentResolver: ContentResolver = context.contentResolver

        val collectionUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
        } else {
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        }

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.DATA,
            MediaStore.Audio.Media.SIZE,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.TRACK
        )

        // Select only music tracks longer than 15 seconds
        val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 AND ${MediaStore.Audio.Media.DURATION} >= 15000"
        val sortOrder = "${MediaStore.Audio.Media.TITLE} ASC"

        try {
            contentResolver.query(
                collectionUri,
                projection,
                selection,
                null,
                sortOrder
            )?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                val dataColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
                val sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
                val yearColumn = cursor.getColumnIndex(MediaStore.Audio.Media.YEAR)
                val trackNumColumn = cursor.getColumnIndex(MediaStore.Audio.Media.TRACK)

                val gradientPalette = listOf(
                    listOf(0xFF0F172A, 0xFF3B82F6, 0xFF8B5CF6),
                    listOf(0xFF1E1B4B, 0xFF6366F1, 0xFFEC4899),
                    listOf(0xFF064E3B, 0xFF10B981, 0xFF06B6D4),
                    listOf(0xFF431407, 0xFFF97316, 0xFFFBBF24),
                    listOf(0xFF0F766E, 0xFF14B8A6, 0xFFA7F3D0),
                    listOf(0xFF831843, 0xFFF43F5E, 0xFFFDA4AF),
                    listOf(0xFF312E81, 0xFF4F46E5, 0xFF818CF8)
                )

                var index = 0
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idColumn)
                    val title = cursor.getString(titleColumn) ?: "Unknown Title"
                    val artist = cursor.getString(artistColumn) ?: "Unknown Artist"
                    val album = cursor.getString(albumColumn) ?: "Unknown Album"
                    val durationMs = cursor.getLong(durationColumn)
                    val filePath = cursor.getString(dataColumn) ?: ""
                    val sizeBytes = cursor.getLong(sizeColumn)
                    val year = if (yearColumn != -1) cursor.getInt(yearColumn) else 2024
                    val trackNum = if (trackNumColumn != -1) cursor.getInt(trackNumColumn) else 1

                    val durationSeconds = (durationMs / 1000).toInt()
                    val sizeMb = if (sizeBytes > 0) sizeBytes / (1024.0 * 1024.0) else 5.0

                    // Infer format
                    val extension = filePath.substringAfterLast('.', "mp3").lowercase()
                    val format = when (extension) {
                        "flac" -> AudioFormat.FLAC
                        "wav" -> AudioFormat.WAV
                        "m4a" -> AudioFormat.M4A
                        "aac" -> AudioFormat.AAC
                        "ogg" -> AudioFormat.OGG
                        "opus" -> AudioFormat.OPUS
                        else -> AudioFormat.MP3
                    }

                    val folder = if (filePath.isNotEmpty()) {
                        File(filePath).parent ?: "/storage/emulated/0/Music"
                    } else {
                        "/storage/emulated/0/Music"
                    }

                    val itemUri = android.content.ContentUris.withAppendedId(collectionUri, id)

                    val track = Track(
                        id = "media_store_$id",
                        title = title,
                        artist = if (artist.contains("<unknown>", ignoreCase = true)) "Unknown Artist" else artist,
                        album = if (album.contains("<unknown>", ignoreCase = true)) "Unknown Album" else album,
                        durationSeconds = durationSeconds,
                        format = format,
                        source = TrackSource.LOCAL,
                        coverGradient = gradientPalette[index % gradientPalette.size],
                        year = if (year > 1900) year else 2024,
                        genre = "Local Audio",
                        trackNumber = if (trackNum > 0) trackNum else 1,
                        fileSizeMb = Math.round(sizeMb * 10.0) / 10.0,
                        playCount = 0,
                        isFavorite = false,
                        folderPath = folder,
                        contentUriString = itemUri.toString(),
                        filePath = filePath
                    )

                    tracksList.add(track)
                    index++
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        tracksList
    }
}
