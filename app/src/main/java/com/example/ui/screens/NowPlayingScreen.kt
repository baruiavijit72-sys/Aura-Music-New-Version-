package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.PlaybackMode
import com.example.state.AppScreen
import com.example.state.AuraViewModel
import com.example.ui.components.AudioVisualizer
import com.example.ui.components.LrcLyricsView
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NowPlayingScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val track = viewModel.currentTrack ?: return
    var activeTab by remember { mutableIntStateOf(0) } // 0: Cover Art, 1: Real-time Lyrics, 2: Audio Engine Settings
    var isSpeedMenuOpen by remember { mutableStateOf(false) }

    // Vinyl spinning animation when playing
    val infiniteTransition = rememberInfiniteTransition(label = "vinyl")
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 8000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "vinylRotation"
    )

    val currentRotation = if (viewModel.isPlaying) rotationAngle else 0f

    val bgGradient = remember(track.coverGradient) {
        listOf(
            Color(track.coverGradient.first()).copy(alpha = 0.85f),
            Color(0xFF0F172A),
            Color(0xFF070B14)
        )
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = Color(0xFF070B14)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.verticalGradient(bgGradient))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .padding(bottom = 24.dp)
            ) {
                // Top Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.isNowPlayingExpanded = false }) {
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowDown,
                            contentDescription = "Collapse",
                            modifier = Modifier.size(32.dp),
                            tint = Color.White
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "PLAYING FROM LIBRARY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                letterSpacing = 1.5.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = Color.LightGray
                        )
                        Text(
                            text = track.album,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row {
                        IconButton(onClick = {
                            viewModel.isNowPlayingExpanded = false
                            viewModel.navigateTo(AppScreen.EQUALIZER)
                        }) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = "Equalizer",
                                tint = AuraSecondary
                            )
                        }
                        IconButton(onClick = { viewModel.isQueueSheetVisible = true }) {
                            Icon(
                                imageVector = Icons.Default.QueueMusic,
                                contentDescription = "Queue",
                                tint = Color.White
                            )
                        }
                    }
                }

            // View Switcher Tabs (Cover, Synced Lyrics, Audio Engine)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                ) {
                    Row(modifier = Modifier.padding(3.dp)) {
                        TabButton(
                            label = "Cover",
                            icon = Icons.Default.Album,
                            isSelected = activeTab == 0,
                            onClick = { activeTab = 0 }
                        )
                        TabButton(
                            label = "Lyrics",
                            icon = Icons.Default.Lyrics,
                            isSelected = activeTab == 1,
                            onClick = { activeTab = 1 }
                        )
                        TabButton(
                            label = "Engine & EQ",
                            icon = Icons.Default.GraphicEq,
                            isSelected = activeTab == 2,
                            onClick = { activeTab = 2 }
                        )
                    }
                }
            }

            // Main Display Area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                when (activeTab) {
                    0 -> {
                        // Album Art Vinyl / Card Display
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(260.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0F172A))
                                    .rotate(currentRotation),
                                contentAlignment = Alignment.Center
                            ) {
                                // Vinyl grooves
                                Box(
                                    modifier = Modifier
                                        .size(240.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF1E293B)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    // Center label
                                    Box(
                                        modifier = Modifier
                                            .size(130.dp)
                                            .clip(CircleShape)
                                            .background(
                                                Brush.linearGradient(
                                                    track.coverGradient.map { Color(it) }
                                                )
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(24.dp)
                                                .clip(CircleShape)
                                                .background(Color.Black)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Live Audio visualizer bars
                            AudioVisualizer(
                                frequencies = viewModel.visualizerFrequencies,
                                modifier = Modifier.padding(horizontal = 20.dp),
                                barColor = AuraPrimary,
                                accentColor = AuraSecondary
                            )
                        }
                    }
                    1 -> {
                        // Real-time scrolling LRC Lyrics
                        LrcLyricsView(
                            track = track,
                            viewModel = viewModel
                        )
                    }
                    2 -> {
                        // In-player Audio Engine Tuning (Speed, Pitch, Gapless, Crossfade)
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = "Audio Processing Engine",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            // Playback Speed
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Playback Speed", style = MaterialTheme.typography.bodyMedium)
                                        Text("${viewModel.playbackSpeed}x", fontWeight = FontWeight.Bold, color = AuraPrimary)
                                    }
                                    Slider(
                                        value = viewModel.playbackSpeed,
                                        onValueChange = { viewModel.setSpeed(it) },
                                        valueRange = 0.5f..2.0f,
                                        steps = 5,
                                        colors = SliderDefaults.colors(thumbColor = AuraPrimary, activeTrackColor = AuraPrimary)
                                    )
                                }
                            }

                            // Crossfade Transitions
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Gapless Crossfade", style = MaterialTheme.typography.bodyMedium)
                                        Text("${viewModel.soundSettings.crossfadeSeconds}s", fontWeight = FontWeight.Bold, color = AuraSecondary)
                                    }
                                    Slider(
                                        value = viewModel.soundSettings.crossfadeSeconds.toFloat(),
                                        onValueChange = { viewModel.updateCrossfade(it.toInt()) },
                                        valueRange = 0f..10f,
                                        steps = 9,
                                        colors = SliderDefaults.colors(thumbColor = AuraSecondary, activeTrackColor = AuraSecondary)
                                    )
                                }
                            }

                            Button(
                                onClick = { viewModel.navigateTo(AppScreen.EQUALIZER) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                            ) {
                                Icon(Icons.Default.Tune, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Open 10-Band Graphic Equalizer")
                            }
                        }
                    }
                }
            }

            // Track Information & Heart
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = track.title,
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${track.artist} • ${track.year}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Format Pill
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AuraPrimary.copy(alpha = 0.2f),
                    modifier = Modifier.padding(horizontal = 8.dp)
                ) {
                    Text(
                        text = "${track.format.extension} • ${track.format.bitDepth}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = AuraPrimary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                // Favorite Heart Button
                IconButton(
                    onClick = { viewModel.toggleFavorite(track.id) },
                    modifier = Modifier.size(44.dp)
                ) {
                    Icon(
                        imageVector = if (track.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = if (track.isFavorite) Color(0xFFEC4899) else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }

            // Scrub Bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
            ) {
                val currentSec = viewModel.playbackPositionSeconds
                val totalSec = track.durationSeconds.toFloat().coerceAtLeast(1f)

                Slider(
                    value = currentSec.coerceIn(0f, totalSec),
                    onValueChange = { viewModel.seekTo(it) },
                    valueRange = 0f..totalSec,
                    modifier = Modifier.fillMaxWidth(),
                    colors = SliderDefaults.colors(
                        thumbColor = AuraPrimary,
                        activeTrackColor = AuraPrimary,
                        inactiveTrackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val currentMin = (currentSec / 60).toInt()
                    val currentRemainingSec = (currentSec % 60).toInt()
                    val remainingTotalSec = (totalSec - currentSec).coerceAtLeast(0f)
                    val remMin = (remainingTotalSec / 60).toInt()
                    val remSec = (remainingTotalSec % 60).toInt()

                    Text(
                        text = String.format("%d:%02d", currentMin, currentRemainingSec),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = String.format("-%d:%02d", remMin, remSec),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Main Playback Controls
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Shuffle Mode
                IconButton(onClick = { viewModel.togglePlaybackMode() }) {
                    Icon(
                        imageVector = when (viewModel.playbackMode) {
                            PlaybackMode.SHUFFLE -> Icons.Default.Shuffle
                            PlaybackMode.REPEAT_ONE -> Icons.Default.RepeatOne
                            PlaybackMode.REPEAT_ALL -> Icons.Default.Repeat
                            PlaybackMode.SEQUENTIAL -> Icons.Default.Repeat
                        },
                        contentDescription = "Mode",
                        tint = if (viewModel.playbackMode != PlaybackMode.SEQUENTIAL) AuraPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // 10s Rewind
                IconButton(onClick = { viewModel.seekRelative(-10f) }) {
                    Icon(
                        imageVector = Icons.Default.Replay10,
                        contentDescription = "10s Back",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Previous
                IconButton(onClick = { viewModel.skipToPrevious() }) {
                    Icon(
                        imageVector = Icons.Default.SkipPrevious,
                        contentDescription = "Previous",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(34.dp)
                    )
                }

                // Play / Pause Giant Button
                FilledIconButton(
                    onClick = { viewModel.togglePlayPause() },
                    modifier = Modifier.size(68.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = AuraPrimary,
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = if (viewModel.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Play/Pause",
                        modifier = Modifier.size(36.dp)
                    )
                }

                // Next
                IconButton(onClick = { viewModel.skipToNext() }) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = "Next",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(34.dp)
                    )
                }

                // 10s Forward
                IconButton(onClick = { viewModel.seekRelative(10f) }) {
                    Icon(
                        imageVector = Icons.Default.Forward10,
                        contentDescription = "10s Forward",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Sleep Timer Trigger
                IconButton(onClick = { viewModel.isSleepTimerDialogVisible = true }) {
                    Icon(
                        imageVector = Icons.Default.Bedtime,
                        contentDescription = "Sleep Timer",
                        tint = if (viewModel.isSleepTimerActive) AuraSecondary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
}

@Composable
fun TabButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(9.dp),
        color = if (isSelected) AuraPrimary else Color.Transparent,
        modifier = Modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
