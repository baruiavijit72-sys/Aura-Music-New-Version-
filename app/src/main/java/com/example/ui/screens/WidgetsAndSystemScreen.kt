package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun WidgetsAndSystemScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val track = viewModel.currentTrack ?: return

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = "System Integration & Widgets",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = "Previews of Android Homescreen Widgets, Lockscreen Player, Media Notification, and Android Auto display.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // 1. Android Notification Panel Player
        Text(
            text = "1. ANDROID MEDIA NOTIFICATION PANEL",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = AuraPrimary
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF1E202C),
            shadowElevation = 8.dp
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.GraphicEq, contentDescription = null, tint = AuraPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Aura Music • Playing", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                    }
                    Text("Lossless FLAC", style = MaterialTheme.typography.labelSmall, color = AuraSecondary)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Brush.linearGradient(track.coverGradient.map { Color(it) })),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MusicNote, contentDescription = null, tint = Color.White)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(track.title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                        Text("${track.artist} — ${track.album}", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
                    }

                    IconButton(onClick = { viewModel.toggleFavorite(track.id) }) {
                        Icon(
                            if (track.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = null,
                            tint = if (track.isFavorite) Color(0xFFEC4899) else Color.LightGray
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Media Notification Action Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.togglePlaybackMode() }) {
                        Icon(Icons.Default.Shuffle, contentDescription = null, tint = Color.LightGray)
                    }
                    IconButton(onClick = { viewModel.skipToPrevious() }) {
                        Icon(Icons.Default.SkipPrevious, contentDescription = null, tint = Color.White)
                    }
                    FilledIconButton(
                        onClick = { viewModel.togglePlayPause() },
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = AuraPrimary, contentColor = Color.White)
                    ) {
                        Icon(if (viewModel.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, contentDescription = null)
                    }
                    IconButton(onClick = { viewModel.skipToNext() }) {
                        Icon(Icons.Default.SkipNext, contentDescription = null, tint = Color.White)
                    }
                    IconButton(onClick = { viewModel.togglePlaybackMode() }) {
                        Icon(Icons.Default.Repeat, contentDescription = null, tint = Color.LightGray)
                    }
                }
            }
        }

        // 2. Android Homescreen Widgets (4x2 Medium & 2x2 Compact)
        Text(
            text = "2. HOMESCREEN WIDGET (4x2 MATERIAL YOU)",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = AuraSecondary
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            shadowElevation = 6.dp
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.linearGradient(track.coverGradient.map { Color(it) })),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Equalizer, contentDescription = null, tint = Color.White, modifier = Modifier.size(36.dp))
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(track.title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1)
                    Text(track.artist, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { viewModel.skipToPrevious() }, modifier = Modifier.size(36.dp)) {
                            Icon(Icons.Default.SkipPrevious, contentDescription = null)
                        }
                        FilledIconButton(
                            onClick = { viewModel.togglePlayPause() },
                            modifier = Modifier.size(38.dp),
                            colors = IconButtonDefaults.filledIconButtonColors(containerColor = AuraPrimary, contentColor = Color.White)
                        ) {
                            Icon(if (viewModel.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, contentDescription = null)
                        }
                        IconButton(onClick = { viewModel.skipToNext() }, modifier = Modifier.size(36.dp)) {
                            Icon(Icons.Default.SkipNext, contentDescription = null)
                        }
                    }
                }
            }
        }

        // 3. Android Auto Vehicle Display
        Text(
            text = "3. ANDROID AUTO HANDS-FREE VEHICLE INTERFACE",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = Color(0xFF10B981)
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF0A0B10)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = Color(0xFF10B981))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Android Auto • Aura Music Lossless", style = MaterialTheme.typography.labelMedium, color = Color.White)
                    }
                    Text("120 km/h Safe UI", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Brush.linearGradient(track.coverGradient.map { Color(it) })),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MusicNote, contentDescription = null, tint = Color.White)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(track.title, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = Color.White)
                        Text(track.artist, style = MaterialTheme.typography.bodyMedium, color = Color.LightGray)
                    }

                    FilledIconButton(
                        onClick = { viewModel.togglePlayPause() },
                        modifier = Modifier.size(54.dp),
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color(0xFF10B981), contentColor = Color.Black)
                    ) {
                        Icon(if (viewModel.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(30.dp))
                    }
                }
            }
        }
    }
}
