package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.example.model.Playlist
import com.example.state.AuraViewModel
import com.example.ui.components.TrackItem
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun PlaylistsScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    var isNewPlaylistDialogOpen by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("") }
    var newPlaylistDesc by remember { mutableStateOf("") }

    val selectedPl = viewModel.playlists.find { it.id == viewModel.selectedPlaylistId }

    if (selectedPl != null) {
        // PLAYLIST DETAIL VIEW
        val playlistTracks = viewModel.allTracks.filter { selectedPl.trackIds.contains(it.id) }

        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(bottom = 120.dp)
        ) {
            // Header
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { viewModel.selectedPlaylistId = null }) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Playlist",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(selectedPl.coverColorHex), AuraPrimary)
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (selectedPl.isSmartPlaylist) Icons.Default.AutoAwesome else Icons.Default.QueueMusic,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(44.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                if (selectedPl.isSmartPlaylist) {
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = AuraPrimary.copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = "SMART AUTO-PLAYLIST",
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = AuraPrimary,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                }

                                Text(
                                    text = selectedPl.name,
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = selectedPl.description.ifEmpty { "${playlistTracks.size} tracks" },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Action buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    if (playlistTracks.isNotEmpty()) {
                                        viewModel.playTrack(playlistTracks.first())
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Play All (${playlistTracks.size})")
                            }

                            FilledTonalButton(
                                onClick = {
                                    // Send whole playlist via P2P
                                    playlistTracks.forEach { viewModel.toggleP2PTrackSelection(it.id) }
                                    viewModel.navigateTo(com.example.state.AppScreen.P2P_SHARE)
                                },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.WifiTethering, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("P2P Send")
                            }
                        }
                    }
                }
            }

            // Track List inside Playlist
            if (playlistTracks.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No tracks in this playlist yet.\nAdd songs from the Library screen.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                items(playlistTracks) { track ->
                    TrackItem(
                        track = track,
                        viewModel = viewModel,
                        isActive = viewModel.currentTrack?.id == track.id
                    )
                }
            }
        }
    } else {
        // MAIN PLAYLISTS OVERVIEW
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(bottom = 120.dp)
        ) {
            // Header & Create Button
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Smart & Custom Playlists",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${viewModel.playlists.size} playlists available offline",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    FloatingActionButton(
                        onClick = { isNewPlaylistDialogOpen = true },
                        modifier = Modifier.size(44.dp),
                        containerColor = AuraPrimary,
                        contentColor = Color.White
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "New Playlist")
                    }
                }
            }

            // Smart Auto-Playlists Section
            item {
                Text(
                    text = "SMART AUTO-GENERATED PLAYLISTS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        letterSpacing = 1.2.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }

            val smartPlaylists = viewModel.playlists.filter { it.isSmartPlaylist }
            items(smartPlaylists) { pl ->
                PlaylistCard(
                    playlist = pl,
                    trackCount = viewModel.allTracks.count { pl.trackIds.contains(it.id) },
                    onClick = { viewModel.selectedPlaylistId = pl.id }
                )
            }

            // User Custom Playlists Section
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "USER CUSTOM PLAYLISTS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        letterSpacing = 1.2.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }

            val customPlaylists = viewModel.playlists.filter { !it.isSmartPlaylist }
            items(customPlaylists) { pl ->
                PlaylistCard(
                    playlist = pl,
                    trackCount = viewModel.allTracks.count { pl.trackIds.contains(it.id) },
                    onClick = { viewModel.selectedPlaylistId = pl.id },
                    onDelete = { viewModel.deletePlaylist(pl.id) }
                )
            }
        }
    }

    // Create New Playlist Dialog
    if (isNewPlaylistDialogOpen) {
        AlertDialog(
            onDismissRequest = { isNewPlaylistDialogOpen = false },
            title = { Text("Create New Playlist") },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = newPlaylistName,
                        onValueChange = { newPlaylistName = it },
                        label = { Text("Playlist Title") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newPlaylistDesc,
                        onValueChange = { newPlaylistDesc = it },
                        label = { Text("Description (Optional)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newPlaylistName.isNotBlank()) {
                            viewModel.createPlaylist(newPlaylistName, newPlaylistDesc)
                            newPlaylistName = ""
                            newPlaylistDesc = ""
                            isNewPlaylistDialogOpen = false
                        }
                    }
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { isNewPlaylistDialogOpen = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun PlaylistCard(
    playlist: Playlist,
    trackCount: Int,
    onClick: () -> Unit,
    onDelete: (() -> Unit)? = null
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(Color(playlist.coverColorHex), AuraPrimary)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (playlist.isSmartPlaylist) Icons.Default.AutoAwesome else Icons.Default.QueueMusic,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column {
                    Text(
                        text = playlist.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "$trackCount tracks • ${playlist.description.ifEmpty { "Offline Mix" }}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (onDelete != null) {
                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.DeleteOutline,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
