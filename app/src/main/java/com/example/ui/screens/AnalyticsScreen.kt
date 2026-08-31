package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AnalyticsScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val totalTracks = viewModel.allTracks.size
    val totalPlays = viewModel.allTracks.sumOf { it.playCount }

    // Real listening time in hours from SQLite metrics or history
    val totalListeningHours = viewModel.totalListeningSeconds / 3600.0

    // Real Completed vs Skip ratio
    val historySize = viewModel.listeningHistory.size
    val completedCount = viewModel.listeningHistory.count { !it.wasSkipped }
    val completedPercentage = if (historySize > 0) {
        (completedCount * 100.0 / historySize)
    } else {
        100.0
    }

    // Real Lossless Fidelity ratio from library
    val losslessCount = viewModel.allTracks.count { it.format.isLossless }
    val losslessPercentage = if (totalTracks > 0) {
        (losslessCount * 100 / totalTracks)
    } else {
        0
    }

    // Real P2P Data transferred
    val totalP2pMb = viewModel.transferLogs.sumOf { it.totalSizeMb }
    val p2pDataFormatted = if (totalP2pMb >= 1024.0) {
        String.format(Locale.getDefault(), "%.2f GB", totalP2pMb / 1024.0)
    } else {
        String.format(Locale.getDefault(), "%.1f MB", totalP2pMb)
    }

    // Real Top Artists by play count
    val topArtists = remember(viewModel.allTracks, viewModel.listeningHistory) {
        val artistPlayMap = mutableMapOf<String, Int>()
        viewModel.allTracks.forEach { track ->
            artistPlayMap[track.artist] = (artistPlayMap[track.artist] ?: 0) + track.playCount
        }
        artistPlayMap.entries
            .sortedByDescending { it.value }
            .take(4)
            .map { it.key to it.value }
    }

    // Real Genre Distribution
    val genreDistribution = remember(viewModel.allTracks) {
        val total = viewModel.allTracks.size.toFloat()
        if (total > 0) {
            viewModel.allTracks
                .groupBy { it.genre }
                .map { (genre, list) ->
                    val pct = ((list.size / total) * 100).toInt()
                    genre to pct
                }
                .sortedByDescending { it.second }
                .take(4)
        } else {
            emptyList()
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // Summary Stats Bento Grid
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Personal Audio Insights",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Real-time SQLite database analytics calculated from your library & plays",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // 2x2 Real Metric Cards
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricBox(
                        title = "Listening Time",
                        value = if (totalListeningHours >= 0.1) String.format(Locale.getDefault(), "%.1f hrs", totalListeningHours) else "${(viewModel.totalListeningSeconds / 60).toInt()} mins",
                        subtext = if (totalPlays > 0) "$totalPlays total plays" else "Track session active",
                        accentColor = AuraPrimary,
                        modifier = Modifier.weight(1f)
                    )

                    MetricBox(
                        title = "Completed vs Skip",
                        value = "${String.format(Locale.getDefault(), "%.1f", completedPercentage)}%",
                        subtext = if (historySize > 0) "$completedCount completed of $historySize" else "No skips logged",
                        accentColor = Color(0xFF10B981),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricBox(
                        title = "Lossless Fidelity",
                        value = "$losslessPercentage%",
                        subtext = "$losslessCount of $totalTracks Lossless",
                        accentColor = AuraSecondary,
                        modifier = Modifier.weight(1f)
                    )

                    MetricBox(
                        title = "P2P Data Saved",
                        value = p2pDataFormatted,
                        subtext = "${viewModel.transferLogs.size} direct transfers",
                        accentColor = Color(0xFFF59E0B),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Top Artists Section
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Top Artists (By Play Count)",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    val maxPlay = topArtists.maxOfOrNull { it.second }?.coerceAtLeast(1) ?: 1

                    if (topArtists.isEmpty()) {
                        Text(
                            text = "No artists played yet. Play songs to see top artist rankings.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        topArtists.forEach { (artist, plays) ->
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = artist,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                    )
                                    Text(
                                        text = "$plays plays",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = AuraPrimary
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { (plays.toFloat() / maxPlay.toFloat()).coerceIn(0.05f, 1f) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp),
                                    color = AuraPrimary,
                                    trackColor = MaterialTheme.colorScheme.surface
                                )
                            }
                        }
                    }
                }
            }
        }

        // Genre Distribution Section
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Preferred Genres in Library",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    if (genreDistribution.isEmpty()) {
                        Text(
                            text = "No tracks in library yet.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        val colors = listOf(AuraPrimary, AuraSecondary, Color(0xFF10B981), Color(0xFFEC4899))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            genreDistribution.forEachIndexed { index, (genre, pct) ->
                                val color = colors.getOrElse(index) { AuraPrimary }
                                GenreChip("$genre $pct%", color)
                            }
                        }
                    }
                }
            }
        }

        // Detailed Listening Log from SQLite
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "DETAILED PLAY AUDIT LOG (SQLITE)",
                    style = MaterialTheme.typography.labelSmall.copy(
                        letterSpacing = 1.2.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${viewModel.listeningHistory.size} recorded",
                    style = MaterialTheme.typography.labelSmall,
                    color = AuraPrimary
                )
            }
        }

        if (viewModel.listeningHistory.isEmpty()) {
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No Playback Logs Yet",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Songs you play will be permanently recorded in this SQLite audit log.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(viewModel.listeningHistory) { entry ->
                val sdf = remember { SimpleDateFormat("HH:mm:ss • MMM dd", Locale.getDefault()) }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 3.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = entry.trackTitle,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface,
                                maxLines = 1
                            )
                            Text(
                                text = "${entry.artist} • ${sdf.format(Date(entry.timestamp))}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (!entry.wasSkipped) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = if (!entry.wasSkipped) "Completed (100%)" else "Skipped (<30%)",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = if (!entry.wasSkipped) Color(0xFF10B981) else Color(0xFFEF4444),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MetricBox(
    title: String,
    value: String,
    subtext: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = accentColor
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtext,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun GenreChip(text: String, color: Color) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.15f)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = color,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
    }
}
