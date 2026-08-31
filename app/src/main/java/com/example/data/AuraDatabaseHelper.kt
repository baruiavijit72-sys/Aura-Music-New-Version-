package com.example.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.example.model.ListeningHistoryEntry
import com.example.model.TransferLog
import com.example.model.TransferStatus

class AuraDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "aura_music_vault.db"
        private const val DATABASE_VERSION = 1

        // Table: Transfer Logs
        private const val TABLE_TRANSFERS = "transfer_logs"
        private const val COL_TRANS_ID = "id"
        private const val COL_TRANS_DEVICE = "target_device_name"
        private const val COL_TRANS_IS_INCOMING = "is_incoming"
        private const val COL_TRANS_TRACK_COUNT = "track_count"
        private const val COL_TRANS_SIZE_MB = "total_size_mb"
        private const val COL_TRANS_SPEED = "transfer_speed_mbps"
        private const val COL_TRANS_TIMESTAMP = "timestamp"
        private const val COL_TRANS_STATUS = "status"

        // Table: Listening History
        private const val TABLE_HISTORY = "listening_history"
        private const val COL_HIST_ID = "id"
        private const val COL_HIST_TRACK_ID = "track_id"
        private const val COL_HIST_TRACK_TITLE = "track_title"
        private const val COL_HIST_ARTIST = "artist"
        private const val COL_HIST_TIMESTAMP = "timestamp"
        private const val COL_HIST_COMPLETED_PCT = "completed_percentage"
        private const val COL_HIST_SKIPPED = "was_skipped"

        // Table: Listening Metrics (Total seconds listened)
        private const val TABLE_METRICS = "listening_metrics"
        private const val COL_METRIC_KEY = "metric_key"
        private const val COL_METRIC_VAL = "metric_value"
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Create transfer_logs table
        db.execSQL(
            """
            CREATE TABLE $TABLE_TRANSFERS (
                $COL_TRANS_ID TEXT PRIMARY KEY,
                $COL_TRANS_DEVICE TEXT,
                $COL_TRANS_IS_INCOMING INTEGER,
                $COL_TRANS_TRACK_COUNT INTEGER,
                $COL_TRANS_SIZE_MB REAL,
                $COL_TRANS_SPEED REAL,
                $COL_TRANS_TIMESTAMP INTEGER,
                $COL_TRANS_STATUS TEXT
            )
            """.trimIndent()
        )

        // Create listening_history table
        db.execSQL(
            """
            CREATE TABLE $TABLE_HISTORY (
                $COL_HIST_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_HIST_TRACK_ID TEXT,
                $COL_HIST_TRACK_TITLE TEXT,
                $COL_HIST_ARTIST TEXT,
                $COL_HIST_TIMESTAMP INTEGER,
                $COL_HIST_COMPLETED_PCT INTEGER,
                $COL_HIST_SKIPPED INTEGER
            )
            """.trimIndent()
        )

        // Create listening_metrics table
        db.execSQL(
            """
            CREATE TABLE $TABLE_METRICS (
                $COL_METRIC_KEY TEXT PRIMARY KEY,
                $COL_METRIC_VAL REAL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_TRANSFERS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_HISTORY")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_METRICS")
        onCreate(db)
    }

    // --- Transfer Log Operations ---

    fun insertTransferLog(log: TransferLog) {
        try {
            val db = writableDatabase
            val values = ContentValues().apply {
                put(COL_TRANS_ID, log.id)
                put(COL_TRANS_DEVICE, log.targetDeviceName)
                put(COL_TRANS_IS_INCOMING, if (log.isIncoming) 1 else 0)
                put(COL_TRANS_TRACK_COUNT, log.trackCount)
                put(COL_TRANS_SIZE_MB, log.totalSizeMb)
                put(COL_TRANS_SPEED, log.transferSpeedMbps)
                put(COL_TRANS_TIMESTAMP, log.timestamp)
                put(COL_TRANS_STATUS, log.status.name)
            }
            db.insertWithOnConflict(TABLE_TRANSFERS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getAllTransferLogs(): List<TransferLog> {
        val list = mutableListOf<TransferLog>()
        try {
            val db = readableDatabase
            val cursor = db.query(
                TABLE_TRANSFERS,
                null,
                null,
                null,
                null,
                null,
                "$COL_TRANS_TIMESTAMP DESC"
            )
            cursor.use {
                while (it.moveToNext()) {
                    val id = it.getString(it.getColumnIndexOrThrow(COL_TRANS_ID))
                    val device = it.getString(it.getColumnIndexOrThrow(COL_TRANS_DEVICE))
                    val isIncoming = it.getInt(it.getColumnIndexOrThrow(COL_TRANS_IS_INCOMING)) == 1
                    val count = it.getInt(it.getColumnIndexOrThrow(COL_TRANS_TRACK_COUNT))
                    val sizeMb = it.getDouble(it.getColumnIndexOrThrow(COL_TRANS_SIZE_MB))
                    val speed = it.getDouble(it.getColumnIndexOrThrow(COL_TRANS_SPEED))
                    val timestamp = it.getLong(it.getColumnIndexOrThrow(COL_TRANS_TIMESTAMP))
                    val statusStr = it.getString(it.getColumnIndexOrThrow(COL_TRANS_STATUS))
                    val status = try {
                        TransferStatus.valueOf(statusStr)
                    } catch (e: Exception) {
                        TransferStatus.COMPLETED
                    }

                    list.add(
                        TransferLog(
                            id = id,
                            targetDeviceName = device,
                            isIncoming = isIncoming,
                            trackCount = count,
                            totalSizeMb = sizeMb,
                            transferSpeedMbps = speed,
                            timestamp = timestamp,
                            status = status
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    // --- Listening History Operations ---

    fun insertListeningHistory(entry: ListeningHistoryEntry) {
        try {
            val db = writableDatabase
            val values = ContentValues().apply {
                put(COL_HIST_TRACK_ID, entry.trackId)
                put(COL_HIST_TRACK_TITLE, entry.trackTitle)
                put(COL_HIST_ARTIST, entry.artist)
                put(COL_HIST_TIMESTAMP, entry.timestamp)
                put(COL_HIST_COMPLETED_PCT, entry.completedPercentage)
                put(COL_HIST_SKIPPED, if (entry.wasSkipped) 1 else 0)
            }
            db.insert(TABLE_HISTORY, null, values)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getAllListeningHistory(limit: Int = 100): List<ListeningHistoryEntry> {
        val list = mutableListOf<ListeningHistoryEntry>()
        try {
            val db = readableDatabase
            val cursor = db.query(
                TABLE_HISTORY,
                null,
                null,
                null,
                null,
                null,
                "$COL_HIST_TIMESTAMP DESC",
                limit.toString()
            )
            cursor.use {
                while (it.moveToNext()) {
                    val trackId = it.getString(it.getColumnIndexOrThrow(COL_HIST_TRACK_ID))
                    val title = it.getString(it.getColumnIndexOrThrow(COL_HIST_TRACK_TITLE))
                    val artist = it.getString(it.getColumnIndexOrThrow(COL_HIST_ARTIST))
                    val timestamp = it.getLong(it.getColumnIndexOrThrow(COL_HIST_TIMESTAMP))
                    val completedPct = it.getInt(it.getColumnIndexOrThrow(COL_HIST_COMPLETED_PCT))
                    val skipped = it.getInt(it.getColumnIndexOrThrow(COL_HIST_SKIPPED)) == 1

                    list.add(
                        ListeningHistoryEntry(
                            trackId = trackId,
                            trackTitle = title,
                            artist = artist,
                            timestamp = timestamp,
                            completedPercentage = completedPct,
                            wasSkipped = skipped
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    // --- Listening Time Metrics ---

    fun incrementListeningSeconds(seconds: Double) {
        try {
            val current = getListeningSeconds()
            val newTotal = current + seconds
            val db = writableDatabase
            val values = ContentValues().apply {
                put(COL_METRIC_KEY, "total_listening_seconds")
                put(COL_METRIC_VAL, newTotal)
            }
            db.insertWithOnConflict(TABLE_METRICS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getListeningSeconds(): Double {
        try {
            val db = readableDatabase
            val cursor = db.query(
                TABLE_METRICS,
                arrayOf(COL_METRIC_VAL),
                "$COL_METRIC_KEY = ?",
                arrayOf("total_listening_seconds"),
                null,
                null,
                null
            )
            cursor.use {
                if (it.moveToFirst()) {
                    return it.getDouble(0)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return 0.0
    }
}
