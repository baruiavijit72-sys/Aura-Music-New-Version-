package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Track
import com.example.state.AppScreen
import com.example.state.AuraViewModel
import com.example.ui.components.AudioVisualizer
import com.example.ui.components.RealAdBanner
import com.example.ui.components.TrackItem
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun HomeScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // Top Signature Header: Made by Avijit (Ultra-Stylish Ribbon)
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(20.dp)),
                color = Color(0xFF0F1017),
                border = BorderStroke(
                    1.2.dp,
                    Brush.horizontalGradient(
                        listOf(
                            Color(0xFFD97706),
                            Color(0xFFFBBF24),
                            Color(0xFFEC4899),
                            Color(0xFF38BDF8),
                            Color(0xFFD97706)
                        )
                    )
                ),
                shadowElevation = 6.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 9.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(7.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color(0xFFFBBF24),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "MADE BY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                fontSize = 10.sp
                            ),
                            color = Color(0xFFCBD5E1)
                        )
                        Text(
                            text = "✦",
                            color = Color(0xFF38BDF8),
                            fontSize = 11.sp
                        )
                        Text(
                            text = "AVIJIT",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.8.sp,
                                fontSize = 14.sp
                            ),
                            color = Color(0xFFFDE68A)
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                        border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.4f))
                    ) {
                        Text(
                            text = "32-BIT LOSSLESS",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp,
                                letterSpacing = 0.8.sp
                            ),
                            color = Color(0xFF34D399),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }
        }

        // Quick Action Chips Row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ActionPill(
                    icon = Icons.Default.Shuffle,
                    label = "Shuffle All",
                    accentColor = AuraPrimary,
                    onClick = {
                        viewModel.togglePlaybackMode()
                        viewModel.playTrack(viewModel.allTracks.random())
                    }
                )

                ActionPill(
                    icon = Icons.Default.WifiTethering,
                    label = "P2P Share",
                    accentColor = AuraSecondary,
                    onClick = { viewModel.navigateTo(AppScreen.P2P_SHARE) }
                )

                ActionPill(
                    icon = Icons.Default.GraphicEq,
                    label = "10-Band EQ",
                    accentColor = Color(0xFF10B981),
                    onClick = { viewModel.navigateTo(AppScreen.EQUALIZER) }
                )

                ActionPill(
                    icon = Icons.Default.ContentCut,
                    label = "Ringtone Cutter",
                    accentColor = Color(0xFFF59E0B),
                    onClick = {
                        viewModel.currentTrack?.let { viewModel.openTrimmer(it) }
                    }
                )

                ActionPill(
                    icon = Icons.Default.Widgets,
                    label = "Widgets",
                    accentColor = Color(0xFFEC4899),
                    onClick = { viewModel.navigateTo(AppScreen.SYSTEM_WIDGETS) }
                )
            }
        }

        // Live Audio Spectrum / Currently Playing Hero Banner
        item {
            val current = viewModel.currentTrack
            if (current != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .clickable { viewModel.isNowPlayingExpanded = true },
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                    tonalElevation = 4.dp
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(if (viewModel.isPlaying) Color(0xFF10B981) else Color.Gray)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (viewModel.isPlaying) "NOW STREAMING HIGH-RES" else "AUDIO ENGINE PAUSED",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        letterSpacing = 1.2.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = if (viewModel.isPlaying) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = AuraPrimary.copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = "${current.format.extension} • ${current.format.bitDepth}",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = AuraPrimary,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        Brush.linearGradient(
                                            current.coverGradient.map { Color(it) }
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MusicNote,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(28.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = current.title,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${current.artist} • ${current.album}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            FilledIconButton(
                                onClick = { viewModel.togglePlayPause() },
                                modifier = Modifier.size(44.dp),
                                colors = IconButtonDefaults.filledIconButtonColors(
                                    containerColor = AuraPrimary,
                                    contentColor = Color.White
                                )
                            ) {
                                Icon(
                                    imageVector = if (viewModel.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                    contentDescription = null
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Real-time audio visualizer frequency spectrum
                        AudioVisualizer(
                            frequencies = viewModel.visualizerFrequencies,
                            barColor = AuraPrimary,
                            accentColor = AuraSecondary
                        )
                    }
                }
            }
        }

        // Real Interactive Ad Network Banner
        item {
            Spacer(modifier = Modifier.height(10.dp))
            RealAdBanner(
                campaignIndex = 0
            )
        }

        // Jump Back In / Recently Played Carousel
        item {
            Spacer(modifier = Modifier.height(16.dp))
            SectionHeader(
                title = "Jump Back In",
                subtitle = "Recently played lossless tracks",
                onSeeAllClick = { viewModel.navigateTo(AppScreen.LIBRARY) }
            )

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(viewModel.allTracks.take(5)) { track ->
                    RecentlyPlayedCard(
                        track = track,
                        isPlaying = viewModel.currentTrack?.id == track.id && viewModel.isPlaying,
                        onClick = { viewModel.playTrack(track) }
                    )
                }
            }
        }

        // Storage & Library Scanner Summary
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                tonalElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.SdCard,
                                contentDescription = null,
                                tint = AuraSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Device Offline Storage",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${viewModel.allTracks.size} indexed tracks • 2.4 GB Lossless • Zero-data",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    val context = LocalContext.current
                    OutlinedButton(
                        onClick = {
                            viewModel.scanDeviceStorage(context)
                        },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        if (viewModel.isScanningDeviceStorage) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = AuraPrimary
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (viewModel.isScanningDeviceStorage) "Scanning..." else "Rescan", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        // Quick Picks / Recommended Tracks
        item {
            Spacer(modifier = Modifier.height(20.dp))
            SectionHeader(
                title = "Quick Picks",
                subtitle = "Highest bit-rate tracks on device",
                onSeeAllClick = { viewModel.navigateTo(AppScreen.LIBRARY) }
            )
        }

        items(viewModel.allTracks.take(4)) { track ->
            TrackItem(
                track = track,
                viewModel = viewModel,
                isActive = viewModel.currentTrack?.id == track.id
            )
        }
    }
}

@Composable
fun ActionPill(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    accentColor: Color,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = accentColor,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    subtitle: String,
    onSeeAllClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        TextButton(onClick = onSeeAllClick) {
            Text("See all", style = MaterialTheme.typography.labelMedium, color = AuraPrimary)
        }
    }
}

@Composable
fun RecentlyPlayedCard(
    track: Track,
    isPlaying: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(135.dp)
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(115.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        Brush.linearGradient(
                            track.coverGradient.map { Color(it) }
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isPlaying) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.6f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Equalizer,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                } else {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.85f),
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Format badge in corner
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = Color.Black.copy(alpha = 0.65f),
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(6.dp)
                ) {
                    Text(
                        text = track.format.extension,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = track.title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = track.artist,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
