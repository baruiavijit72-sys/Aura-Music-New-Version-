package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Track
import com.example.model.TrackSource
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun TrackItem(
    track: Track,
    viewModel: AuraViewModel,
    isActive: Boolean = false,
    showSelectCheckbox: Boolean = false,
    isSelectedForP2P: Boolean = false,
    onSelectToggle: () -> Unit = {},
    onClick: () -> Unit = { viewModel.playTrack(track) }
) {
    var isMenuExpanded by remember { mutableStateOf(false) }
    var isPlaylistSelectDialogOpen by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 3.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable {
                if (showSelectCheckbox) {
                    onSelectToggle()
                } else {
                    onClick()
                }
            },
        color = if (isActive) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)
        else MaterialTheme.colorScheme.surface,
        tonalElevation = if (isActive) 4.dp else 1.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Selection Checkbox for P2P bulk share
            if (showSelectCheckbox) {
                Checkbox(
                    checked = isSelectedForP2P,
                    onCheckedChange = { onSelectToggle() },
                    colors = CheckboxDefaults.colors(checkedColor = AuraPrimary)
                )
                Spacer(modifier = Modifier.width(4.dp))
            }

            // Cover Art gradient box
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        Brush.linearGradient(
                            track.coverGradient.map { Color(it) }
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isActive && viewModel.isPlaying) {
                    Icon(
                        imageVector = Icons.Default.Equalizer,
                        contentDescription = "Playing",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.MusicNote,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.85f),
                        modifier = Modifier.size(22.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Track metadata details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = track.title,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
                        ),
                        color = if (isActive) AuraPrimary else MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    // Lossless Audio Chip
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (track.format.isLossless) AuraSecondary.copy(alpha = 0.18f)
                        else MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = track.format.extension,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = if (track.format.isLossless) AuraSecondary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }

                    if (track.source == TrackSource.P2P_RECEIVED) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = Color(0xFFF59E0B).copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "P2P",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = Color(0xFFF59E0B),
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "${track.artist} • ${track.album}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "• ${track.durationFormatted}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }

            // Action: Favorite Heart
            IconButton(
                onClick = { viewModel.toggleFavorite(track.id) },
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = if (track.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (track.isFavorite) Color(0xFFEC4899) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                    modifier = Modifier.size(18.dp)
                )
            }

            // Options 3-dots Menu
            Box {
                IconButton(
                    onClick = { isMenuExpanded = true },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "More Options",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }

                DropdownMenu(
                    expanded = isMenuExpanded,
                    onDismissRequest = { isMenuExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Play Next") },
                        leadingIcon = { Icon(Icons.Default.QueuePlayNext, contentDescription = null) },
                        onClick = {
                            viewModel.playNext(track)
                            isMenuExpanded = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Add to Queue") },
                        leadingIcon = { Icon(Icons.Default.AddToQueue, contentDescription = null) },
                        onClick = {
                            viewModel.addToQueue(track)
                            isMenuExpanded = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Add to Playlist...") },
                        leadingIcon = { Icon(Icons.Default.PlaylistAdd, contentDescription = null) },
                        onClick = {
                            isMenuExpanded = false
                            isPlaylistSelectDialogOpen = true
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Send via P2P Share") },
                        leadingIcon = { Icon(Icons.Default.WifiTethering, contentDescription = null) },
                        onClick = {
                            viewModel.toggleP2PTrackSelection(track.id)
                            viewModel.navigateTo(com.example.state.AppScreen.P2P_SHARE)
                            isMenuExpanded = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Ringtone Cutter & Trimmer") },
                        leadingIcon = { Icon(Icons.Default.ContentCut, contentDescription = null) },
                        onClick = {
                            viewModel.openTrimmer(track)
                            isMenuExpanded = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Edit ID3 Metadata Tags") },
                        leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                        onClick = {
                            viewModel.openTagEditor(track)
                            isMenuExpanded = false
                        }
                    )
                }
            }
        }
    }

    // Add to Playlist Dialog
    if (isPlaylistSelectDialogOpen) {
        AlertDialog(
            onDismissRequest = { isPlaylistSelectDialogOpen = false },
            title = { Text("Add to Playlist") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    viewModel.playlists.filter { !it.isSmartPlaylist }.forEach { pl ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    viewModel.addTrackToPlaylist(pl.id, track.id)
                                    isPlaylistSelectDialogOpen = false
                                }
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.QueueMusic,
                                contentDescription = null,
                                tint = AuraPrimary
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(text = pl.name, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { isPlaylistSelectDialogOpen = false }) {
                    Text("Close")
                }
            }
        )
    }
}
