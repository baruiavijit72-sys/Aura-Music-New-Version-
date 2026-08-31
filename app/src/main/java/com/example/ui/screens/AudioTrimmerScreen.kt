package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AudioTrimmerScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val track = viewModel.trimmingTrack ?: viewModel.currentTrack ?: return
    val totalSec = track.durationSeconds.toFloat().coerceAtLeast(1f)

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Track Header Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.ContentCut,
                    contentDescription = null,
                    tint = AuraPrimary,
                    modifier = Modifier.size(32.dp)
                )
                Spacer(modifier = Modifier.width(14.dp))
                Column {
                    Text(
                        text = track.title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${track.artist} • Duration: ${track.durationFormatted}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Waveform Visual Trimmer Box
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF0F172A)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "WAVEFORM SELECTOR",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.LightGray
                    )
                    Text(
                        text = "Clip: ${String.format("%.1f", viewModel.trimEndSeconds - viewModel.trimStartSeconds)}s",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = AuraSecondary
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // High-density waveform canvas
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val barCount = 60
                        val barWidth = size.width / barCount
                        val seed = track.title.hashCode()
                        val rnd = Random(seed)

                        val startFraction = (viewModel.trimStartSeconds / totalSec).coerceIn(0f, 1f)
                        val endFraction = (viewModel.trimEndSeconds / totalSec).coerceIn(0f, 1f)

                        val startX = startFraction * size.width
                        val endX = endFraction * size.width

                        // Draw selection highlight background
                        drawRect(
                            color = AuraPrimary.copy(alpha = 0.25f),
                            topLeft = Offset(startX, 0f),
                            size = Size(endX - startX, size.height)
                        )

                        // Draw waveform bars
                        for (i in 0 until barCount) {
                            val barHeight = rnd.nextFloat() * (size.height * 0.85f) + 10f
                            val x = i * barWidth
                            val isInsideSelection = x in startX..endX

                            drawRect(
                                color = if (isInsideSelection) AuraPrimary else Color.DarkGray,
                                topLeft = Offset(x + 1.dp.toPx(), (size.height - barHeight) / 2f),
                                size = Size(barWidth - 2.dp.toPx(), barHeight)
                            )
                        }

                        // Draw Start & End boundary lines
                        drawLine(
                            color = AuraSecondary,
                            start = Offset(startX, 0f),
                            end = Offset(startX, size.height),
                            strokeWidth = 3.dp.toPx()
                        )
                        drawLine(
                            color = AuraSecondary,
                            start = Offset(endX, 0f),
                            end = Offset(endX, size.height),
                            strokeWidth = 3.dp.toPx()
                        )
                    }
                }
            }
        }

        // Start & End Time Sliders
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Start Position
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Start Time", style = MaterialTheme.typography.bodyMedium)
                        Text("${String.format("%.1f", viewModel.trimStartSeconds)}s", fontWeight = FontWeight.Bold, color = AuraPrimary)
                    }
                    Slider(
                        value = viewModel.trimStartSeconds,
                        onValueChange = {
                            viewModel.trimStartSeconds = it.coerceAtMost(viewModel.trimEndSeconds - 2f)
                        },
                        valueRange = 0f..totalSec,
                        colors = SliderDefaults.colors(thumbColor = AuraPrimary, activeTrackColor = AuraPrimary)
                    )
                }

                // End Position
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("End Time", style = MaterialTheme.typography.bodyMedium)
                        Text("${String.format("%.1f", viewModel.trimEndSeconds)}s", fontWeight = FontWeight.Bold, color = AuraSecondary)
                    }
                    Slider(
                        value = viewModel.trimEndSeconds,
                        onValueChange = {
                            viewModel.trimEndSeconds = it.coerceAtLeast(viewModel.trimStartSeconds + 2f)
                        },
                        valueRange = 0f..totalSec,
                        colors = SliderDefaults.colors(thumbColor = AuraSecondary, activeTrackColor = AuraSecondary)
                    )
                }
            }
        }

        // Preview Selection Loop Button
        FilledTonalButton(
            onClick = {
                viewModel.isTrimmingPlaying = !viewModel.isTrimmingPlaying
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(
                imageVector = if (viewModel.isTrimmingPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = null
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(if (viewModel.isTrimmingPlaying) "Stop Preview Loop" else "Preview Selected Clip Loop")
        }

        // Export Actions Section
        Text(
            text = "SET AS SYSTEM AUDIO TONE",
            style = MaterialTheme.typography.labelSmall.copy(
                letterSpacing = 1.2.sp,
                fontWeight = FontWeight.Bold
            ),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.exportTrimmedAudio("Phone Ringtone") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
            ) {
                Icon(Icons.Default.RingVolume, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Ringtone", style = MaterialTheme.typography.labelSmall)
            }

            Button(
                onClick = { viewModel.exportTrimmedAudio("Notification Sound") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AuraSecondary)
            ) {
                Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Black)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Notification", color = Color.Black, style = MaterialTheme.typography.labelSmall)
            }

            Button(
                onClick = { viewModel.exportTrimmedAudio("Alarm Tone") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
            ) {
                Icon(Icons.Default.Alarm, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Alarm", style = MaterialTheme.typography.labelSmall)
            }
        }

        // Status Feedback Banner
        if (viewModel.trimExportSuccessMessage != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF10B981).copy(alpha = 0.2f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = viewModel.trimExportSuccessMessage!!,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }
}
